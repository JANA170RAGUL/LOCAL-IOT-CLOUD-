"""
app/modules/alerts/api/router.py

FastAPI router for the Alerts module.
"""

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.core.constants import DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE
from app.database.session import get_db
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

router = APIRouter(
    tags=["Alerts"],
)


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
) -> AlertResponse:
    return svc.create_alert(db, payload)


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
) -> AlertListResponse:
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
        items=items,
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
) -> AlertResponse:
    return svc.get_alert(db, alert_id)


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
) -> AlertResponse:
    return svc.update_alert(db, alert_id, payload)


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
) -> AlertResponse:
    return svc.acknowledge_alert(db, alert_id, payload.acknowledged_by)


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
) -> AlertResponse:
    return svc.resolve_alert(db, alert_id)


@router.delete(
    "/alerts/{alert_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Soft-delete/close an alert",
)
def deactivate_alert(
    alert_id: str,
    db: Session = Depends(get_db),
    svc: AlertService = Depends(get_alert_service),
) -> None:
    svc.deactivate_alert(db, alert_id)
