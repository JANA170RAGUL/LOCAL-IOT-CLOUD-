from typing import Optional
from sqlalchemy.orm import Session
from app.modules.users.repositories.user_repository import UserRepository
from app.modules.users.schemas.user import UserCreate, UserUpdate
from app.modules.users.models.user import User
from app.core.password import hash_password

from fastapi import HTTPException
import string
import secrets
import logging
from app.modules.users.schemas.user import UserFilter, ChangePasswordRequest, ResetPasswordRequest
from app.core.password import verify_password

from app.core.constants import UserRole

logger = logging.getLogger(__name__)

from app.modules.licensing.features import LicenseFeature
from app.modules.licensing.services.license_policy import license_policy
from app.modules.licensing.services.license_usage import license_usage


class UserService:
    def __init__(self):
        self.repository = UserRepository()

    def create(self, db: Session, payload: UserCreate, current_user: Optional[User] = None) -> User:
        snapshot = license_policy.get_snapshot(db)
        current_count = license_usage.count_users(db)
        license_policy.ensure_capacity(
            snapshot,
            LicenseFeature.USERS,
            current_count=current_count,
        )

        # Check duplicate email
        if self.get_by_email(db, payload.email):
            raise HTTPException(status_code=400, detail="Email already registered")

        if current_user:
            # Operator and Viewer cannot create users
            if current_user.role in [UserRole.OPERATOR.value, UserRole.VIEWER.value]:
                raise HTTPException(status_code=403, detail="Operators and Viewers cannot create users")

            # Org Admin cannot create Super Admin
            if current_user.role == UserRole.ORG_ADMIN.value:
                if payload.role == UserRole.SUPER_ADMIN.value:
                    raise HTTPException(status_code=403, detail="Org Admins cannot create Super Admin users")
                # Force user to current_user's organization
                payload.organization_id = current_user.organization_id
                if current_user.tenant_id:
                    payload.tenant_id = current_user.tenant_id
            
        raw_password = payload.password
        user_data = payload.model_dump()
        user_data["password_hash"] = hash_password(user_data.pop("password"))
            
        new_user = User(**user_data)
        created_user = self.repository.create(db, new_user)
        
        try:
            from app.modules.notifications.services.notification_service import NotificationService
            notif_svc = NotificationService(db)
            notif_svc.enqueue_notification(
                template_name="USER_CREATED_PASSWORD",
                recipient=created_user.email,
                context={"first_name": created_user.first_name, "password": raw_password},
                user_id=created_user.id
            )
        except Exception as e:
            logger.error(f"Failed to enqueue welcome email: {e}")
            
        return created_user

    def list(self, db: Session, filters: UserFilter, current_user: Optional[User] = None) -> dict:
        organization_id = None
        tenant_id = None

        if current_user and current_user.role != UserRole.SUPER_ADMIN.value:
            organization_id = current_user.organization_id
            tenant_id = current_user.tenant_id

        return self.repository.list(
            db,
            filters,
            tenant_id=tenant_id,
            organization_id=organization_id
        )

    def get_by_email(self, db: Session, email: str) -> Optional[User]:
        return self.repository.get_by_email(db, email)

    def get_by_id(self, db: Session, user_id: str, current_user: Optional[User] = None) -> User:
        user = self.repository.get_by_id(db, user_id)
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        if current_user and current_user.role != UserRole.SUPER_ADMIN.value:
            if current_user.organization_id and user.organization_id != current_user.organization_id:
                raise HTTPException(status_code=404, detail="User not found")
            elif current_user.tenant_id and user.tenant_id != current_user.tenant_id:
                raise HTTPException(status_code=404, detail="User not found")

        return user

    def update(self, db: Session, user_id: str, payload: UserUpdate, current_user: Optional[User] = None) -> User:
        user = self.get_by_id(db, user_id, current_user)

        if current_user:
            # Operators and Viewers cannot update users
            if current_user.role in [UserRole.OPERATOR.value, UserRole.VIEWER.value]:
                raise HTTPException(status_code=403, detail="Operators and Viewers cannot update users")

            # Prevent self-role modification
            if current_user.id == user_id and payload.role is not None and payload.role != current_user.role:
                raise HTTPException(status_code=403, detail="Users cannot modify their own role")

            # Org Admin restrictions
            if current_user.role == UserRole.ORG_ADMIN.value:
                if user.role == UserRole.SUPER_ADMIN.value:
                    raise HTTPException(status_code=403, detail="Org Admins cannot edit Super Admin users")
                if payload.role == UserRole.SUPER_ADMIN.value:
                    raise HTTPException(status_code=403, detail="Org Admins cannot promote users to Super Admin")

        update_data = payload.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(user, key, value)
        
        updated_user = self.repository.update(db, user)
        if not updated_user.is_active or updated_user.status != "ACTIVE":
            from app.modules.auth.services.session_service import SessionService
            SessionService.revoke_all_user_sessions(db, updated_user.id, reason="Account disabled")

        return updated_user
        
    def delete(self, db: Session, user_id: str, current_user: Optional[User] = None) -> dict:
        user = self.get_by_id(db, user_id, current_user)

        if current_user:
            if current_user.id == user_id:
                raise HTTPException(status_code=400, detail="Cannot delete your own account")
            if current_user.role in [UserRole.OPERATOR.value, UserRole.VIEWER.value]:
                raise HTTPException(status_code=403, detail="Operators and Viewers cannot delete users")
            if current_user.role == UserRole.ORG_ADMIN.value and user.role == UserRole.SUPER_ADMIN.value:
                raise HTTPException(status_code=403, detail="Org Admins cannot delete Super Admin users")

        user.status = "INACTIVE"
        user.is_active = False
        self.repository.update(db, user)

        from app.modules.auth.services.session_service import SessionService
        SessionService.revoke_all_user_sessions(db, user.id, reason="Account deleted")

        return {"detail": "User deleted successfully"}

    def change_password(self, db: Session, user_id: str, payload: ChangePasswordRequest):
        user = self.repository.get_by_id(db, user_id)
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        if not verify_password(payload.current_password, user.password_hash):
            raise HTTPException(status_code=400, detail="Incorrect current password")
            
        if payload.new_password != payload.confirm_password:
            raise HTTPException(status_code=400, detail="Passwords do not match")
            
        user.password_hash = hash_password(payload.new_password)
        self.repository.update(db, user)
        return {"detail": "Password updated successfully"}

    def reset_password(self, db: Session, user_id: str, payload: ResetPasswordRequest, current_user: Optional[User] = None):
        user = self.get_by_id(db, user_id, current_user)

        if current_user:
            if current_user.role in [UserRole.OPERATOR.value, UserRole.VIEWER.value]:
                raise HTTPException(status_code=403, detail="Operators and Viewers cannot reset passwords")
            if current_user.role == UserRole.ORG_ADMIN.value and user.role == UserRole.SUPER_ADMIN.value:
                raise HTTPException(status_code=403, detail="Org Admins cannot reset passwords for Super Admin users")
        
        if payload.auto_generate:
            alphabet = string.ascii_letters + string.digits + "!@#$%^&*"
            new_pwd = ''.join(secrets.choice(alphabet) for i in range(12))
        else:
            if not payload.new_password or payload.new_password != payload.confirm_password:
                raise HTTPException(status_code=400, detail="Invalid password provided")
            new_pwd = payload.new_password
            
        user.password_hash = hash_password(new_pwd)
        self.repository.update(db, user)
        
        logger.info(f"Sending temporary password '{new_pwd}' to user {user.email}")
        
        return {"detail": "Password reset successfully", "temporary_password": new_pwd if payload.auto_generate else None}

