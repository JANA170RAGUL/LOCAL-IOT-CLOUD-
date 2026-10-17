from typing import Optional
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.core.jwt import extract_bearer_token, get_token_subject, decode_access_token
from app.core.exceptions import InvalidTokenError
from app.modules.users.models.user import User
from app.modules.users.services.user_service import UserService
from app.core.permissions import has_permission

security = HTTPBearer()
security_optional = HTTPBearer(auto_error=False)

def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
) -> User:
    try:
        token = credentials.credentials
        decode_access_token(token)
        user_id = get_token_subject(token)
    except InvalidTokenError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired access token",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    svc = UserService()
    try:
        user = svc.get_by_id(db, user_id)
    except HTTPException as e:
        if e.status_code == 404:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED, 
                detail="User not found",
                headers={"WWW-Authenticate": "Bearer"},
            )
        raise e
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, 
            detail="User not found",
            headers={"WWW-Authenticate": "Bearer"},
        )
    if not user.is_active or user.status != "ACTIVE":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User account inactive.",
            headers={"WWW-Authenticate": "Bearer"},
        )
        
    return user

def get_current_user_optional(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security_optional),
    db: Session = Depends(get_db)
) -> Optional[User]:
    if not credentials:
        return None
    try:
        token = credentials.credentials
        decode_access_token(token)
        user_id = get_token_subject(token)
        
        svc = UserService()
        try:
            user = svc.get_by_id(db, user_id)
            if user and user.is_active:
                return user
        except HTTPException as e:
            if e.status_code == 404:
                return None
            raise e
    except Exception:
        pass
    return None

def require_permission(permission: str):
    def permission_dependency(current_user: User = Depends(get_current_user)):
        if not has_permission(current_user.role, permission):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Not enough permissions. Required: {permission}"
            )
        return current_user
    return permission_dependency
