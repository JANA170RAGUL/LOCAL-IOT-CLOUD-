from fastapi import Depends
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.modules.settings.services.settings_service import SettingsService
from app.modules.settings.services.health_service import HealthService
from app.modules.settings.repositories.audit_log_repository import AuditLogRepository

def get_settings_service(db: Session = Depends(get_db)) -> SettingsService:
    return SettingsService(db)

def get_health_service() -> HealthService:
    return HealthService()

def get_audit_log_repository(db: Session = Depends(get_db)) -> AuditLogRepository:
    return AuditLogRepository(db)
