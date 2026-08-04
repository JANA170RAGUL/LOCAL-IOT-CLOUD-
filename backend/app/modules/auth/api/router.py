from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.core.auth import get_current_user
from app.modules.users.models.user import User
from app.modules.auth.schemas.auth import (
    LoginRequest, TokenResponse, ChangePasswordRequest, 
    ForgotPasswordRequest, ResetPasswordRequest,
    RequestVerificationRequest, VerifyEmailRequest
)
from app.modules.users.schemas.user import UserResponse
from app.modules.auth.services.auth_service import AuthService

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/login", response_model=TokenResponse)
def login(payload: LoginRequest, request: Request, db: Session = Depends(get_db)):
    # Basic attempt to get IP and User-Agent
    ip_address = request.client.host if request.client else None
    device_info = request.headers.get("user-agent")
    
    svc = AuthService(db)
    result = svc.login(payload.email, payload.password, ip_address, device_info)
    
    return {
        "access_token": result["access_token"],
        "refresh_token": result["refresh_token"],
        "token_type": "bearer",
        "requires_password_change": result["requires_password_change"]
    }

@router.post("/logout")
def logout(refresh_token: str, db: Session = Depends(get_db)):
    svc = AuthService(db)
    svc.logout_session(refresh_token)
    return {"message": "Successfully logged out"}

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
        # In a real system, send email here. Mock for now.
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
    
    if not token_record or token_record.expires_at < datetime.now(timezone.utc):
        raise HTTPException(status_code=400, detail="Invalid or expired token")
        
    user = db.query(User).filter(User.id == token_record.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    svc = AuthService(db)
    svc.change_user_password(user, payload.new_password)
    
    token_record.is_used = True
    db.commit()
    
    return {"message": "Password reset successfully"}

@router.get("/sessions")
def get_active_sessions(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    from app.modules.auth.models.user_session import UserSession
    sessions = db.query(UserSession).filter(
        UserSession.user_id == current_user.id, 
        UserSession.is_active == True
    ).all()
    return [{
        "id": s.id, 
        "device_info": s.device_info, 
        "ip_address": s.ip_address, 
        "created_at": s.created_at,
        "expires_at": s.expires_at
    } for s in sessions]

@router.post("/sessions/logout-all")
def logout_all_sessions(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    svc = AuthService(db)
    svc.logout_all_sessions(current_user.id)
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

