from fastapi import APIRouter, Depends
from typing import Dict, Any

from app.core.auth import get_current_user, require_permission
from app.modules.users.models.user import User
from app.modules.settings.schemas.setting import CategoryUpdateRequest
from app.modules.settings.schemas.audit import AuditLogListResponse
from app.modules.settings.schemas.health import HealthStatusResponse
from app.modules.settings.services.settings_service import SettingsService
from app.modules.settings.services.health_service import HealthService
from app.modules.settings.repositories.audit_log_repository import AuditLogRepository
from app.modules.settings.dependencies import get_settings_service, get_health_service, get_audit_log_repository

router = APIRouter(prefix="/settings", tags=["Settings"])

@router.get("/health", response_model=HealthStatusResponse)
def get_health(
    current_user: User = Depends(require_permission("system:admin")),
    health_service: HealthService = Depends(get_health_service)
):
    return health_service.get_service_health()

@router.get("/audit", response_model=AuditLogListResponse)
def get_audit_logs(
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(require_permission("system:admin")),
    audit_repo: AuditLogRepository = Depends(get_audit_log_repository)
):
    logs, total = audit_repo.list(skip=skip, limit=limit)
    return AuditLogListResponse(total=total, items=logs)

from pydantic import BaseModel
import smtplib
from email.mime.text import MIMEText
from fastapi import HTTPException

class TestEmailRequest(BaseModel):
    smtpHost: str
    smtpPort: int
    username: str = None
    password: str = None
    senderName: str
    senderEmail: str
    toEmail: str

@router.post("/email/test")
def test_email_config(
    request: TestEmailRequest,
    current_user: User = Depends(require_permission("system:admin"))
):
    try:
        server = smtplib.SMTP(request.smtpHost, request.smtpPort, timeout=10)
        server.starttls()
        if request.username and request.password:
            server.login(request.username, request.password)
            
        msg = MIMEText("This is a test email from LocalIoTCloud to verify your SMTP configuration.")
        msg['Subject'] = "LocalIoTCloud - SMTP Test"
        msg['From'] = f"{request.senderName} <{request.senderEmail}>"
        msg['To'] = request.toEmail
        
        server.send_message(msg)
        server.quit()
        return {"detail": "Test email sent successfully!"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to send test email: {str(e)}")

@router.get("/{category}")
def get_settings(
    category: str,
    current_user: User = Depends(require_permission("system:admin")),
    settings_service: SettingsService = Depends(get_settings_service)
) -> Dict[str, Any]:
    return settings_service.get_category_settings(category)

@router.put("/{category}")
def update_settings(
    category: str,
    request: CategoryUpdateRequest,
    current_user: User = Depends(require_permission("system:admin")),
    settings_service: SettingsService = Depends(get_settings_service)
) -> Dict[str, Any]:
    return settings_service.update_category_settings(
        category=category,
        request=request,
        user_id=current_user.id,
        user_name=f"{current_user.first_name} {current_user.last_name}"
    )
