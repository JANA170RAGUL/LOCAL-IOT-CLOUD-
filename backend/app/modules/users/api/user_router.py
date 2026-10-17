"""
app/modules/users/api/user_router.py

FastAPI router for User Management endpoints.
"""
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session
from typing import Optional

from app.core.constants import DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE
from app.database.session import get_db
from app.core.auth import get_current_user, require_permission
from app.modules.users.models.user import User
from app.modules.users.schemas.user import (
    UserCreate,
    UserUpdate,
    UserResponse,
    UserListResponse,
    UserFilter,
    ChangePasswordRequest,
    ResetPasswordRequest
)
from app.modules.users.services.user_service import UserService

router = APIRouter(
    prefix="/users",
    tags=["Users"],
)

def get_user_service() -> UserService:
    return UserService()

# Helper to determine tenant scope for an admin
def get_tenant_scope(user: User) -> Optional[str]:
    # Super Admin can see all, Org Admin is restricted to their tenant
    if user.role == "Super Admin":
        return None
    return user.tenant_id

@router.get(
    "/",
    response_model=UserListResponse,
    summary="List users",
    dependencies=[Depends(require_permission("user:read"))]
)
def list_users(
    search: Optional[str] = Query(None, description="Keyword search across name and email"),
    role: Optional[str] = Query(None, description="Filter by role"),
    user_status: Optional[str] = Query(None, alias="status", description="Filter by status"),
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(DEFAULT_PAGE_SIZE, ge=1, le=MAX_PAGE_SIZE, description="Items per page"),
    db: Session = Depends(get_db),
    svc: UserService = Depends(get_user_service),
    current_user: User = Depends(get_current_user)
) -> dict:
    filters = UserFilter(
        search=search,
        role=role,
        status=user_status,
        page=page,
        page_size=page_size
    )
    return svc.list(db, filters, current_user=current_user)

@router.post(
    "/",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create user",
    dependencies=[Depends(require_permission("user:create"))]
)
def create_user(
    payload: UserCreate,
    db: Session = Depends(get_db),
    svc: UserService = Depends(get_user_service),
    current_user: User = Depends(get_current_user)
) -> User:
    return svc.create(db, payload, current_user=current_user)

@router.get(
    "/me",
    response_model=UserResponse,
    summary="Get current user"
)
def get_me(
    current_user: User = Depends(get_current_user)
) -> User:
    return current_user

@router.get(
    "/{user_id}",
    response_model=UserResponse,
    summary="Get user",
    dependencies=[Depends(require_permission("user:read"))]
)
def get_user(
    user_id: str,
    db: Session = Depends(get_db),
    svc: UserService = Depends(get_user_service),
    current_user: User = Depends(get_current_user)
) -> User:
    return svc.get_by_id(db, user_id, current_user=current_user)

@router.patch(
    "/{user_id}",
    response_model=UserResponse,
    summary="Update user",
    dependencies=[Depends(require_permission("user:update"))]
)
def update_user(
    user_id: str,
    payload: UserUpdate,
    db: Session = Depends(get_db),
    svc: UserService = Depends(get_user_service),
    current_user: User = Depends(get_current_user)
) -> User:
    return svc.update(db, user_id, payload, current_user=current_user)

@router.delete(
    "/{user_id}",
    summary="Delete/Disable user",
    dependencies=[Depends(require_permission("user:delete"))]
)
def delete_user(
    user_id: str,
    db: Session = Depends(get_db),
    svc: UserService = Depends(get_user_service),
    current_user: User = Depends(get_current_user)
) -> dict:
    return svc.delete(db, user_id, current_user=current_user)

@router.post(
    "/{user_id}/reset-password",
    summary="Reset user password",
    dependencies=[Depends(require_permission("user:update"))]
)
def reset_password(
    user_id: str,
    payload: ResetPasswordRequest,
    db: Session = Depends(get_db),
    svc: UserService = Depends(get_user_service),
    current_user: User = Depends(get_current_user)
) -> dict:
    return svc.reset_password(db, user_id, payload, current_user=current_user)

@router.post(
    "/change-password",
    summary="Change own password"
)
def change_password(
    payload: ChangePasswordRequest,
    db: Session = Depends(get_db),
    svc: UserService = Depends(get_user_service),
    current_user: User = Depends(get_current_user)
) -> dict:
    return svc.change_password(db, current_user.id, payload)

from app.modules.users.schemas.user import UpdateEmailRequest, UpdatePhoneRequest, UpdateAvatarRequest

@router.put("/me/email", summary="Update email address")
def update_email(
    payload: UpdateEmailRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Require email verification. We generate a token and send a mock email.
    from app.modules.auth.services.auth_service import AuthService
    svc = AuthService(db)
    token = svc.generate_verification_token(current_user.id, "EMAIL_VERIFICATION")
    import logging
    logging.info(f"Mock Email: Verification token to update email to {payload.new_email} is {token}")
    
    current_user.email = payload.new_email
    current_user.is_verified = False
    db.commit()
    return {"message": "Email updated. Please verify your new email."}

@router.put("/me/phone", summary="Update phone number")
def update_phone(
    payload: UpdatePhoneRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    current_user.phone = payload.new_phone
    db.commit()
    return {"message": "Phone number updated successfully."}

@router.put("/me/avatar", summary="Update avatar URL")
def update_avatar(
    payload: UpdateAvatarRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    current_user.avatar_url = payload.avatar_url
    db.commit()
    return {"message": "Avatar updated successfully."}

@router.get("/me/login-history", summary="Get recent login history")
def get_login_history(
    limit: int = Query(10, ge=1, le=50),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    from app.modules.auth.models.login_history import LoginHistory
    history = db.query(LoginHistory).filter(LoginHistory.user_id == current_user.id)\
        .order_by(LoginHistory.created_at.desc()).limit(limit).all()
    return [{"status": h.status, "ip_address": h.ip_address, "device_info": h.device_info, "created_at": h.created_at} for h in history]

