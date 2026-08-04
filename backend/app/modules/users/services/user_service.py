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

logger = logging.getLogger(__name__)

class UserService:
    def __init__(self):
        self.repository = UserRepository()

    def create(self, db: Session, payload: UserCreate, tenant_id: Optional[str] = None) -> User:
        # Check duplicate email
        if self.get_by_email(db, payload.email):
            raise HTTPException(status_code=400, detail="Email already registered")
            
        raw_password = payload.password
        user_data = payload.model_dump()
        user_data["password_hash"] = hash_password(user_data.pop("password"))
        if tenant_id:
            user_data["tenant_id"] = tenant_id
            
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

    def list(self, db: Session, filters: UserFilter, tenant_id: Optional[str] = None) -> dict:
        return self.repository.list(db, filters, tenant_id)

    def get_by_email(self, db: Session, email: str) -> Optional[User]:
        return self.repository.get_by_email(db, email)

    def get_by_id(self, db: Session, user_id: str, tenant_id: Optional[str] = None) -> Optional[User]:
        user = self.repository.get_by_id(db, user_id)
        if not user or (tenant_id and user.tenant_id != tenant_id):
            raise HTTPException(status_code=404, detail="User not found")
        return user

    def update(self, db: Session, user_id: str, payload: UserUpdate, tenant_id: Optional[str] = None) -> User:
        user = self.get_by_id(db, user_id, tenant_id)
        update_data = payload.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(user, key, value)
        return self.repository.update(db, user)
        
    def delete(self, db: Session, user_id: str, tenant_id: Optional[str] = None) -> dict:
        user = self.get_by_id(db, user_id, tenant_id)
        user.status = "INACTIVE"
        user.is_active = False
        self.repository.update(db, user)
        return {"detail": "User deleted successfully"}

    def change_password(self, db: Session, user_id: str, payload: ChangePasswordRequest):
        user = self.get_by_id(db, user_id)
        if not verify_password(payload.current_password, user.password_hash):
            raise HTTPException(status_code=400, detail="Incorrect current password")
            
        if payload.new_password != payload.confirm_password:
            raise HTTPException(status_code=400, detail="Passwords do not match")
            
        user.password_hash = hash_password(payload.new_password)
        self.repository.update(db, user)
        return {"detail": "Password updated successfully"}

    def reset_password(self, db: Session, user_id: str, payload: ResetPasswordRequest, tenant_id: Optional[str] = None):
        user = self.get_by_id(db, user_id, tenant_id)
        
        if payload.auto_generate:
            alphabet = string.ascii_letters + string.digits + "!@#$%^&*"
            new_pwd = ''.join(secrets.choice(alphabet) for i in range(12))
        else:
            if not payload.new_password or payload.new_password != payload.confirm_password:
                raise HTTPException(status_code=400, detail="Invalid password provided")
            new_pwd = payload.new_password
            
        user.password_hash = hash_password(new_pwd)
        self.repository.update(db, user)
        
        # Placeholder for actual email sending logic
        logger.info(f"Sending temporary password '{new_pwd}' to user {user.email}")
        
        return {"detail": "Password reset successfully", "temporary_password": new_pwd if payload.auto_generate else None}
