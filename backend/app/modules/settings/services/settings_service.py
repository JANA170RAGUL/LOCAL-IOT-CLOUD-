from sqlalchemy.orm import Session
from app.modules.settings.repositories.settings_repository import SettingsRepository
from app.modules.settings.repositories.audit_log_repository import AuditLogRepository
from app.modules.settings.schemas.setting import CategoryUpdateRequest
from app.modules.settings.schemas.audit import AuditLogCreate
from typing import Dict, Any

class SettingsService:
    def __init__(self, db: Session):
        self.settings_repo = SettingsRepository(db)
        self.audit_repo = AuditLogRepository(db)

    def get_category_settings(self, category: str) -> Dict[str, Any]:
        settings = self.settings_repo.get_by_category(category)
        return {s.key: s.value for s in settings}

    def update_category_settings(self, category: str, request: CategoryUpdateRequest, user_id: str, user_name: str) -> Dict[str, Any]:
        self.settings_repo.update_category_settings(category, request.settings)

        # Log audit
        self.audit_repo.create(AuditLogCreate(
            user_id=user_id,
            user_name=user_name,
            action=f"Updated {category} settings",
            resource_type="settings",
            resource_id=category,
            details=request.settings
        ))

        return self.get_category_settings(category)
