import logging
from datetime import datetime, timezone, timedelta
from typing import Optional, List

from sqlalchemy.orm import Session
from fastapi import HTTPException, status

from app.config.settings import settings
from app.core.password import verify_password, hash_password
from app.core.jwt import create_access_token
from app.core.security import generate_activation_token
from app.modules.users.models.user import User
from app.modules.auth.models.password_history import PasswordHistory
from app.modules.auth.models.user_session import UserSession
from app.modules.auth.models.login_history import LoginHistory
from app.modules.auth.models.verification_token import VerificationToken
from app.modules.auth.security.login_limiter import login_allowed, register_failed_login, clear_failed_logins
from app.modules.auth.services.session_service import SessionService

logger = logging.getLogger(__name__)

MAX_FAILED_ATTEMPTS = 5
LOCKOUT_MINUTES = 15
PASSWORD_HISTORY_LIMIT = 5

class AuthService:
    def __init__(self, db: Session):
        self.db = db

    def record_login_attempt(self, user_id: str, success: bool, ip_address: Optional[str] = None, device_info: Optional[str] = None):
        history = LoginHistory(
            user_id=user_id,
            status="SUCCESS" if success else "FAILED",
            ip_address=ip_address,
            device_info=device_info
        )
        self.db.add(history)
        self.db.commit()

    def handle_failed_login(self, user: User):
        user.failed_login_attempts += 1
        if user.failed_login_attempts >= MAX_FAILED_ATTEMPTS:
            user.locked_until = datetime.now(timezone.utc) + timedelta(minutes=LOCKOUT_MINUTES)
        self.db.commit()

    def check_password_history(self, user_id: str, new_password: str) -> bool:
        history = self.db.query(PasswordHistory).filter(PasswordHistory.user_id == user_id)\
            .order_by(PasswordHistory.created_at.desc()).limit(PASSWORD_HISTORY_LIMIT).all()
        for record in history:
            if verify_password(new_password, str(record.password_hash)):
                return False
        return True

    def change_user_password(self, user: User, new_password: str):
        if not self.check_password_history(user.id, new_password):
            raise HTTPException(status_code=400, detail="Cannot reuse a recent password.")
        
        new_hash = hash_password(new_password)
        
        hist = PasswordHistory(user_id=user.id, password_hash=new_hash)
        self.db.add(hist)
        
        user.password_hash = new_hash
        user.force_password_change = False
        user.password_changed_at = datetime.now(timezone.utc)
        self.db.commit()

        # Revoke all existing refresh sessions upon password change
        SessionService.revoke_all_user_sessions(self.db, user.id, reason="Password changed")

    def login(self, email: str, password: str, ip_address: Optional[str] = None, device_info: Optional[str] = None):
        if not login_allowed(email):
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Too many login attempts. Try again later."
            )

        user = self.db.query(User).filter(User.email == email).first()
        
        if not user or not verify_password(password, str(user.password_hash)):
            register_failed_login(email)
            if user:
                self.record_login_attempt(user.id, False, ip_address, device_info)
                self.handle_failed_login(user)
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password.",
            )

        if not user.is_active or user.status != "ACTIVE":
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User account inactive."
            )

        if user.locked_until and user.locked_until.replace(tzinfo=timezone.utc) > datetime.now(timezone.utc):
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Account is temporarily locked. Try again later."
            )

        # Successful login
        clear_failed_logins(email)
        user.failed_login_attempts = 0
        user.locked_until = None
        user.last_login = datetime.now(timezone.utc)
        
        self.record_login_attempt(user.id, True, ip_address, device_info)
        
        access_token = create_access_token(
            subject=user.id,
            extra_claims={
                "role": user.role, 
                "tenant_id": user.tenant_id,
                "force_password_change": user.force_password_change
            }
        )
        
        session, raw_refresh_token = SessionService.create(
            self.db,
            user_id=user.id,
            ip_address=ip_address,
            user_agent=device_info
        )
        
        return {
            "access_token": access_token,
            "refresh_token": raw_refresh_token,
            "token_type": "bearer",
            "expires_in": settings.access_token_expire_minutes * 60,
            "requires_password_change": user.force_password_change
        }

    def refresh(self, raw_refresh_token: str, ip_address: Optional[str] = None, user_agent: Optional[str] = None):
        old_session = SessionService.authenticate_refresh_token(self.db, raw_refresh_token)
        user = old_session.user

        new_session, new_refresh_token = SessionService.rotate(
            self.db,
            old_session,
            ip_address=ip_address,
            user_agent=user_agent
        )

        access_token = create_access_token(
            subject=user.id,
            extra_claims={
                "role": user.role,
                "tenant_id": user.tenant_id,
                "force_password_change": user.force_password_change
            }
        )

        return {
            "access_token": access_token,
            "refresh_token": new_refresh_token,
            "token_type": "bearer",
            "expires_in": settings.access_token_expire_minutes * 60,
            "requires_password_change": user.force_password_change
        }

    def logout_session(self, raw_refresh_token: str):
        try:
            session = SessionService.authenticate_refresh_token(self.db, raw_refresh_token)
            session.revoked_at = datetime.now(timezone.utc)
            session.revoke_reason = "User logout"
            self.db.commit()
        except HTTPException:
            # Logout is idempotent
            pass

    def logout_all_sessions(self, user_id: str, reason: str = "User logout all"):
        SessionService.revoke_all_user_sessions(self.db, user_id, reason=reason)

    def generate_verification_token(self, user_id: str, purpose: str) -> str:
        token = generate_activation_token()
        vtoken = VerificationToken(
            user_id=user_id,
            token=token,
            purpose=purpose,
            expires_at=datetime.now(timezone.utc) + timedelta(hours=24)
        )
        self.db.add(vtoken)
        self.db.commit()
        return token
