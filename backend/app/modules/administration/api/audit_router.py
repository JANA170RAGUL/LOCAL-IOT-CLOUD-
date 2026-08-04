from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from typing import List
import math

from app.database.session import get_db
from app.core.auth import require_permission
from app.modules.users.models.user import User
from app.modules.administration.models.audit_log import AuditLog
from app.modules.administration.models.activity_log import ActivityLog
from app.modules.auth.models.login_history import LoginHistory
from app.modules.auth.models.user_session import UserSession

from app.modules.administration.schemas.audit import AuditLogListResponse, ActivityLogListResponse

router = APIRouter(prefix="/admin", tags=["Administration - Audit & Logs"])

# Require super admin for all these routes
# We'll use a specific permission like "system:admin" or "platform:manage"
# Assuming "system:admin" is the permission for Super Admin.
admin_dep = [Depends(require_permission("system:admin"))]

@router.get("/audit-logs", response_model=AuditLogListResponse, dependencies=admin_dep, summary="22.1 Audit Center")
def get_audit_logs(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db)
):
    query = db.query(AuditLog).order_by(AuditLog.created_at.desc())
    total = query.count()
    items = query.offset((page - 1) * page_size).limit(page_size).all()
    
    return {
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": math.ceil(total / page_size),
        "items": items
    }

@router.get("/activity-logs", response_model=ActivityLogListResponse, dependencies=admin_dep, summary="22.2 Activity Logs")
def get_activity_logs(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db)
):
    query = db.query(ActivityLog).order_by(ActivityLog.created_at.desc())
    total = query.count()
    items = query.offset((page - 1) * page_size).limit(page_size).all()
    
    return {
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": math.ceil(total / page_size),
        "items": items
    }

@router.get("/login-history", dependencies=admin_dep, summary="22.3 Login History (Global)")
def get_global_login_history(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db)
):
    query = db.query(LoginHistory).order_by(LoginHistory.created_at.desc())
    total = query.count()
    items = query.offset((page - 1) * page_size).limit(page_size).all()
    
    # Return directly, skipping formal paginated schema to save time (or add one if needed)
    return {
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": math.ceil(total / page_size),
        "items": [{"id": i.id, "user_id": i.user_id, "created_at": i.created_at, "ip_address": i.ip_address, "device_info": i.device_info, "status": i.status} for i in items]
    }

@router.get("/active-sessions", dependencies=admin_dep, summary="22.4 Active Sessions (Global)")
def get_global_active_sessions(
    db: Session = Depends(get_db)
):
    # Only returning non-revoked
    items = db.query(UserSession).filter(UserSession.is_revoked == False).order_by(UserSession.created_at.desc()).all()
    return [{"id": i.id, "user_id": i.user_id, "ip_address": i.ip_address, "device_info": i.device_info, "created_at": i.created_at, "expires_at": i.expires_at} for i in items]

@router.delete("/active-sessions/{session_id}", dependencies=admin_dep, summary="Force logout session")
def force_logout_session(
    session_id: str,
    db: Session = Depends(get_db)
):
    session = db.query(UserSession).filter(UserSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    session.is_revoked = True
    db.commit()
    return {"message": "Session revoked"}
