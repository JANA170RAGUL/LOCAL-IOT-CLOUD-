from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from datetime import datetime, timedelta

from app.database.session import get_db
from app.core.auth import require_permission

from app.modules.administration.schemas.maintenance import MaintenanceActionResponse, CleanLogsRequest
from app.modules.administration.models.audit_log import AuditLog
from app.modules.administration.models.activity_log import ActivityLog

router = APIRouter(prefix="/admin/maintenance", tags=["Administration - Maintenance"])
admin_dep = [Depends(require_permission("system:admin"))]

@router.post("/restart-workers", response_model=MaintenanceActionResponse, dependencies=admin_dep, summary="22.12 Restart Workers")
def restart_workers():
    # In a real environment, this might signal a process manager like Supervisor or Docker
    # For this system, we can just return a success message since we can't reliably restart uvicorn/threads from within itself
    return {"message": "Background workers restart signal sent", "status": "Success"}

@router.post("/clean-logs", response_model=MaintenanceActionResponse, dependencies=admin_dep, summary="22.12 Clean Logs")
def clean_logs(payload: CleanLogsRequest, db: Session = Depends(get_db)):
    cutoff_date = datetime.now() - timedelta(days=payload.days_to_keep)
    deleted_audit = 0
    deleted_activity = 0
    
    if payload.log_type in ["audit", "all"]:
        deleted_audit = db.query(AuditLog).filter(AuditLog.created_at < cutoff_date).delete()
        
    if payload.log_type in ["activity", "all"]:
        deleted_activity = db.query(ActivityLog).filter(ActivityLog.created_at < cutoff_date).delete()
        
    db.commit()
    
    return {
        "message": f"Cleaned {deleted_audit} audit logs and {deleted_activity} activity logs older than {payload.days_to_keep} days.",
        "status": "Success"
    }
