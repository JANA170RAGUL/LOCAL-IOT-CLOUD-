"""
app/modules/alerts/api/router.py

FastAPI router for the Alerts module.
"""

import asyncio
import logging

from fastapi import APIRouter, Depends, Query, status, WebSocket, WebSocketDisconnect
from sqlalchemy.orm import Session
from sqlalchemy import select

from app.core.constants import DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE
from app.database.session import get_db
from app.database.redis import get_redis_client
from app.modules.alerts.dependencies import get_alert_service
from app.modules.alerts.schemas.alert import (
    AlertCreate,
    AlertUpdate,
    AlertAcknowledgeRequest,
    AlertResponse,
    AlertFilter,
    AlertListResponse,
)
from app.modules.alerts.services.alert_service import AlertService
from app.modules.projects.models.project import Project

from app.core.access_scope import AccessScope, get_access_scope
from app.core.tenant_guard import TenantGuard

logger = logging.getLogger(__name__)

router = APIRouter(
    tags=["Alerts"],
)


def _guard_alert(db: Session, alert_id: str, svc: AlertService, scope: AccessScope):
    alert = svc.get_alert(db, alert_id)
    project_id = svc._get_project_id_for_alert(alert)
    if project_id:
        TenantGuard.project(db, project_id, scope)
    return alert


@router.post(
    "/projects/{project_id}/alerts",
    response_model=AlertResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new alert manually",
    description="Registers an alert under a project.",
)
def create_alert(
    project_id: str,
    payload: AlertCreate,
    db: Session = Depends(get_db),
    svc: AlertService = Depends(get_alert_service),
    scope: AccessScope = Depends(get_access_scope),
) -> AlertResponse:
    TenantGuard.project(db, project_id, scope)
    created = svc.create_alert(db, payload)
    return AlertResponse.model_validate(created)


@router.get(
    "/projects/{project_id}/alerts",
    response_model=AlertListResponse,
    summary="List alerts for project",
    description="Fetch paginated list of alerts under a project with optional filters.",
)
def list_alerts(
    project_id: str,
    status_filter: str | None = Query(None, alias="status", description="Filter by status (e.g. OPEN, ACKNOWLEDGED, RESOLVED, CLOSED)"),
    severity: str | None = Query(None, description="Filter by severity (e.g. INFO, WARNING, CRITICAL, EMERGENCY)"),
    acknowledged: bool | None = Query(None, description="Filter by acknowledged status"),
    resolved: bool | None = Query(None, description="Filter by resolved status"),
    search: str | None = Query(None, description="Search term for title or message"),
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(DEFAULT_PAGE_SIZE, ge=1, le=MAX_PAGE_SIZE, alias="page_size", description="Items per page"),
    db: Session = Depends(get_db),
    svc: AlertService = Depends(get_alert_service),
    scope: AccessScope = Depends(get_access_scope),
) -> AlertListResponse:
    TenantGuard.project(db, project_id, scope)
    filters = AlertFilter(
        status=status_filter,
        severity=severity,
        acknowledged=acknowledged,
        resolved=resolved,
        search=search,
    )
    total, items = svc.list_alerts(db, project_id, filters, page, page_size)
    return AlertListResponse(
        total=total,
        page=page,
        page_size=page_size,
        items=[AlertResponse.model_validate(item) for item in items],
    )


@router.get(
    "/alerts/{alert_id}",
    response_model=AlertResponse,
    summary="Get alert details",
    description="Retrieve details of a single alert by its UUID.",
)
def get_alert(
    alert_id: str,
    db: Session = Depends(get_db),
    svc: AlertService = Depends(get_alert_service),
    scope: AccessScope = Depends(get_access_scope),
) -> AlertResponse:
    _guard_alert(db, alert_id, svc, scope)
    alert = svc.get_alert(db, alert_id)
    return AlertResponse.model_validate(alert)


@router.patch(
    "/alerts/{alert_id}",
    response_model=AlertResponse,
    summary="Partially update an alert",
)
def update_alert(
    alert_id: str,
    payload: AlertUpdate,
    db: Session = Depends(get_db),
    svc: AlertService = Depends(get_alert_service),
    scope: AccessScope = Depends(get_access_scope),
) -> AlertResponse:
    _guard_alert(db, alert_id, svc, scope)
    updated = svc.update_alert(db, alert_id, payload)
    return AlertResponse.model_validate(updated)


@router.post(
    "/alerts/{alert_id}/acknowledge",
    response_model=AlertResponse,
    summary="Acknowledge an alert",
    description="Mark an alert as acknowledged by an operator.",
)
def acknowledge_alert(
    alert_id: str,
    payload: AlertAcknowledgeRequest,
    db: Session = Depends(get_db),
    svc: AlertService = Depends(get_alert_service),
    scope: AccessScope = Depends(get_access_scope),
) -> AlertResponse:
    _guard_alert(db, alert_id, svc, scope)
    acked = svc.acknowledge_alert(db, alert_id, payload.acknowledged_by)
    return AlertResponse.model_validate(acked)


@router.post(
    "/alerts/{alert_id}/resolve",
    response_model=AlertResponse,
    summary="Resolve an alert",
    description="Mark an alert as resolved.",
)
def resolve_alert(
    alert_id: str,
    db: Session = Depends(get_db),
    svc: AlertService = Depends(get_alert_service),
    scope: AccessScope = Depends(get_access_scope),
) -> AlertResponse:
    _guard_alert(db, alert_id, svc, scope)
    resolved = svc.resolve_alert(db, alert_id)
    return AlertResponse.model_validate(resolved)


@router.delete(
    "/alerts/{alert_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Soft-delete/close an alert",
)
def deactivate_alert(
    alert_id: str,
    db: Session = Depends(get_db),
    svc: AlertService = Depends(get_alert_service),
    scope: AccessScope = Depends(get_access_scope),
) -> None:
    _guard_alert(db, alert_id, svc, scope)
    svc.deactivate_alert(db, alert_id)


# ---------------------------------------------------------------------------
# WS /projects/{project_id}/alerts/stream
# ---------------------------------------------------------------------------

@router.websocket("/projects/{project_id}/alerts/stream")
async def websocket_alerts_stream(
    websocket: WebSocket,
    project_id: str,
):
    """
    Subscribes to Redis PubSub for real-time alerts.
    """
    await websocket.accept()
    logger.info(f"WebSocket client connected to alerts stream: {project_id}")

    # Verify project
    from app.database.session import SessionLocal
    db = SessionLocal()
    try:
        project = db.scalar(select(Project).where(Project.id == project_id))
        if not project or not project.is_active:
            await websocket.send_json({"error": "Project not found or inactive."})
            await websocket.close()
            return
    finally:
        db.close()

    r = get_redis_client()
    pubsub = r.pubsub()
    pubsub.subscribe(f"alerts:stream:{project_id}")

    try:
        while True:
            msg = pubsub.get_message(ignore_subscribe_messages=True, timeout=0)
            if msg:
                raw_data = msg.get("data")
                if raw_data is not None:
                    if isinstance(raw_data, bytes):
                        text_data = raw_data.decode("utf-8")
                    else:
                        text_data = str(raw_data)
                    await websocket.send_text(text_data)

            await asyncio.sleep(0.1)
    except WebSocketDisconnect:
        logger.info(f"WebSocket client disconnected from alerts stream: {project_id}")
    finally:
        pubsub.unsubscribe(f"alerts:stream:{project_id}")
        pubsub.close()
