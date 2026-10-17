from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.core.auth import get_current_user
from app.modules.users.models.user import User
from app.modules.auth.schemas.auth import (
    LoginRequest, TokenResponse, RefreshRequest, LogoutRequest, ChangePasswordRequest, 
    ForgotPasswordRequest, ResetPasswordRequest,
    RequestVerificationRequest, VerifyEmailRequest
)
from app.modules.users.schemas.user import UserResponse
from app.modules.auth.services.auth_service import AuthService
from app.modules.auth.services.session_service import SessionService

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/login", response_model=TokenResponse)
def login(payload: LoginRequest, request: Request, db: Session = Depends(get_db)):
    ip_address = request.client.host if request.client else None
    user_agent = request.headers.get("user-agent")
    
    svc = AuthService(db)
    result = svc.login(payload.email, payload.password, ip_address, user_agent)
    return result

@router.post("/refresh", response_model=TokenResponse)
def refresh_access_token(payload: RefreshRequest, request: Request, db: Session = Depends(get_db)):
    ip_address = request.client.host if request.client else None
    user_agent = request.headers.get("user-agent")

    svc = AuthService(db)
    return svc.refresh(payload.refresh_token, ip_address, user_agent)

@router.post("/logout", status_code=204)
def logout(payload: LogoutRequest, db: Session = Depends(get_db)):
    svc = AuthService(db)
    svc.logout_session(payload.refresh_token)
    return None

@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    return current_user

@router.post("/change-password")
def change_password(
    payload: ChangePasswordRequest, 
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    from app.core.password import verify_password
    if not verify_password(payload.current_password, current_user.password_hash):
        raise HTTPException(status_code=400, detail="Incorrect password")
        
    svc = AuthService(db)
    svc.change_user_password(current_user, payload.new_password)
    
    return {"message": "Password changed successfully"}

@router.post("/forgot-password")
def forgot_password(payload: ForgotPasswordRequest, db: Session = Depends(get_db)):
    from app.modules.users.services.user_service import UserService
    usvc = UserService()
    user = usvc.get_by_email(db, payload.email)
    if user:
        svc = AuthService(db)
        token = svc.generate_verification_token(user.id, "PASSWORD_RESET")
        import logging
        logging.info(f"Mock Email: Password reset token for {user.email} is {token}")
        
    return {"message": "If that email is registered, a password reset link has been sent."}

@router.post("/reset-password")
def reset_password(payload: ResetPasswordRequest, db: Session = Depends(get_db)):
    from app.modules.auth.models.verification_token import VerificationToken
    from datetime import datetime, timezone
    
    token_record = db.query(VerificationToken).filter(
        VerificationToken.token == payload.token,
        VerificationToken.purpose == "PASSWORD_RESET",
        VerificationToken.is_used == False
    ).first()
    
    exp_at = token_record.expires_at
    if exp_at and exp_at.tzinfo is None:
        exp_at = exp_at.replace(tzinfo=timezone.utc)

    if not token_record or exp_at < datetime.now(timezone.utc):
        raise HTTPException(status_code=400, detail="Invalid or expired token")
        
    user = db.query(User).filter(User.id == token_record.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    svc = AuthService(db)
    svc.change_user_password(user, payload.new_password)
    SessionService.revoke_all_user_sessions(db, user.id, reason="Password reset")
    
    token_record.is_used = True
    db.commit()
    
    return {"message": "Password reset successfully"}

@router.get("/sessions")
def get_active_sessions(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    from app.modules.auth.models.user_session import UserSession
    from sqlalchemy import select
    sessions = db.scalars(
        select(UserSession).where(
            UserSession.user_id == current_user.id, 
            UserSession.revoked_at.is_(None)
        )
    ).all()
    return [{
        "id": s.id,
        "token_id": s.token_id,
        "ip_address": s.ip_address, 
        "user_agent": s.user_agent,
        "last_used_at": s.last_used_at.isoformat() if s.last_used_at else None,
        "expires_at": s.expires_at.isoformat() if s.expires_at else None,
        "created_at": s.created_at.isoformat() if s.created_at else None,
    } for s in sessions]

@router.delete("/sessions/{session_id}")
def revoke_session(session_id: str, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    from app.modules.auth.models.user_session import UserSession
    from datetime import datetime, timezone
    from sqlalchemy import select
    session = db.scalar(
        select(UserSession).where(
            UserSession.id == session_id,
            UserSession.user_id == current_user.id
        )
    )
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    session.revoked_at = datetime.now(timezone.utc)
    session.revoke_reason = "Revoked by user"
    db.commit()
    return {"message": "Session revoked successfully"}

@router.post("/logout-all")
def logout_all_sessions(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    SessionService.revoke_all_user_sessions(db, current_user.id, reason="User logout all")
    return {"message": "Logged out from all devices successfully"}

@router.post("/request-verification")
def request_verification(payload: RequestVerificationRequest, db: Session = Depends(get_db)):
    from app.modules.users.services.user_service import UserService
    usvc = UserService()
    user = usvc.get_by_email(db, payload.email)
    if user and not user.is_verified:
        svc = AuthService(db)
        token = svc.generate_verification_token(user.id, "EMAIL_VERIFICATION")
        import logging
        logging.info(f"Mock Email: Verification token for {user.email} is {token}")
    return {"message": "If the email is valid and unverified, a verification link has been sent."}

@router.post("/verify-email")
def verify_email(payload: VerifyEmailRequest, db: Session = Depends(get_db)):
    from app.modules.auth.models.verification_token import VerificationToken
    from datetime import datetime, timezone
    
    token_record = db.query(VerificationToken).filter(
        VerificationToken.token == payload.token,
        VerificationToken.purpose == "EMAIL_VERIFICATION",
        VerificationToken.is_used == False
    ).first()
    
    if not token_record or token_record.expires_at < datetime.now(timezone.utc):
        raise HTTPException(status_code=400, detail="Invalid or expired token")
        
    user = db.query(User).filter(User.id == token_record.user_id).first()
    if user:
        user.is_verified = True
        
    token_record.is_used = True
    db.commit()
    return {"message": "Email verified successfully"}

