import logging
from datetime import datetime, timezone, timedelta
from typing import Optional, List

from sqlalchemy.orm import Session
from fastapi import HTTPException, status

from app.core.password import verify_password, hash_password
from app.core.jwt import create_access_token, create_refresh_token
from app.core.security import generate_activation_token
from app.modules.users.models.user import User
from app.modules.auth.models.password_history import PasswordHistory
from app.modules.auth.models.user_session import UserSession
from app.modules.auth.models.login_history import LoginHistory
from app.modules.auth.models.verification_token import VerificationToken

logger = logging.getLogger(__name__)

MAX_FAILED_ATTEMPTS = 5
LOCKOUT_MINUTES = 15
PASSWORD_HISTORY_LIMIT = 5

class AuthService:
    def __init__(self, db: Session):
        self.db = db

    def record_login_attempt(self, user_id: str, success: bool, ip_address: str, device_info: str):
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
        # Check against recent passwords
        history = self.db.query(PasswordHistory).filter(PasswordHistory.user_id == user_id)\
            .order_by(PasswordHistory.created_at.desc()).limit(PASSWORD_HISTORY_LIMIT).all()
        for record in history:
            if verify_password(new_password, record.password_hash):
                return False
        return True

    def change_user_password(self, user: User, new_password: str):
        if not self.check_password_history(user.id, new_password):
            raise HTTPException(status_code=400, detail="Cannot reuse a recent password.")
        
        new_hash = hash_password(new_password)
        
        # Add to history
        hist = PasswordHistory(user_id=user.id, password_hash=new_hash)
        self.db.add(hist)
        
        # Keep history within limit (optional: could prune old records)
        
        user.password_hash = new_hash
        user.force_password_change = False
        user.password_changed_at = datetime.now(timezone.utc)
        self.db.commit()

    def login(self, email: str, password: str, ip_address: str = None, device_info: str = None):
        user = self.db.query(User).filter(User.email == email).first()
        
        if not user:
            # We don't record login attempts for non-existent users here to prevent enumeration
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect email or password",
            )

        if not user.is_active:
            raise HTTPException(status_code=403, detail="Inactive user")

        if user.locked_until and user.locked_until.replace(tzinfo=timezone.utc) > datetime.now(timezone.utc):
            raise HTTPException(status_code=403, detail="Account is temporarily locked. Try again later.")

        if not verify_password(password, user.password_hash):
            self.record_login_attempt(user.id, False, ip_address, device_info)
            self.handle_failed_login(user)
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect email or password",
            )
            
        # Successful login
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
        refresh_token = create_refresh_token(subject=user.id)
        
        # Track session
        session = UserSession(
            user_id=user.id,
            refresh_token=refresh_token,
            device_info=device_info,
            ip_address=ip_address,
            expires_at=datetime.now(timezone.utc) + timedelta(days=7),
            is_active=True
        )
        self.db.add(session)
        self.db.commit()
        
        return {
            "access_token": access_token,
            "refresh_token": refresh_token,
            "requires_password_change": user.force_password_change
        }

    def logout_session(self, refresh_token: str):
        session = self.db.query(UserSession).filter(UserSession.refresh_token == refresh_token).first()
        if session:
            session.is_active = False
            self.db.commit()

    def logout_all_sessions(self, user_id: str):
        sessions = self.db.query(UserSession).filter(UserSession.user_id == user_id, UserSession.is_active == True).all()
        for session in sessions:
            session.is_active = False
        self.db.commit()

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
