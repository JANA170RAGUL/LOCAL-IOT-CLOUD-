"""
app/modules/rules/api/router.py

FastAPI router for the Rules module.
"""

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.core.constants import DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE
from app.database.session import get_db
from app.modules.rules.dependencies import get_rule_service
from app.modules.rules.schemas.rule import (
    RuleCreate,
    RuleUpdate,
    RuleResponse,
    RuleFilter,
    RuleListResponse,
)
from app.modules.rules.services.rule_service import RuleService

from fastapi import HTTPException
from app.core.access_scope import AccessScope, get_access_scope
from app.core.tenant_guard import TenantGuard

router = APIRouter(
    tags=["Rules"],
)


@router.post(
    "/projects/{project_id}/rules",
    response_model=RuleResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new rule",
    description="Registers an automation rule inside a project container.",
)
def create_rule(
    project_id: str,
    payload: RuleCreate,
    db: Session = Depends(get_db),
    svc: RuleService = Depends(get_rule_service),
    scope: AccessScope = Depends(get_access_scope),
) -> RuleResponse:
    TenantGuard.project(db, project_id, scope)
    if getattr(payload, "sensor_id", None):
        sensor = TenantGuard.sensor(db, payload.sensor_id, scope)
        if sensor.device and sensor.device.gateway and sensor.device.gateway.project_id != project_id:
            raise HTTPException(
                status_code=400,
                detail="Sensor does not belong to the selected project.",
            )
    return svc.create_rule(db, project_id, payload)


@router.get(
    "/projects/{project_id}/rules",
    response_model=RuleListResponse,
    summary="List rules for project",
    description="Fetch paginated list of rules under a project with optional filters.",
)
def list_rules(
    project_id: str,
    status_filter: str | None = Query(None, alias="status", description="Filter by status (e.g. ACTIVE, INACTIVE)"),
    enabled: bool | None = Query(None, description="Filter by enabled status"),
    search: str | None = Query(None, description="Search term for name or code"),
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(DEFAULT_PAGE_SIZE, ge=1, le=MAX_PAGE_SIZE, alias="page_size", description="Items per page"),
    db: Session = Depends(get_db),
    svc: RuleService = Depends(get_rule_service),
    scope: AccessScope = Depends(get_access_scope),
) -> RuleListResponse:
    TenantGuard.project(db, project_id, scope)
    filters = RuleFilter(status=status_filter, enabled=enabled, search=search)
    total, items = svc.list_rules(db, project_id, filters, page, page_size)
    return RuleListResponse(
        total=total,
        page=page,
        page_size=page_size,
        items=items,
    )


@router.get(
    "/rules/{rule_id}",
    response_model=RuleResponse,
    summary="Get rule details",
    description="Retrieve details of a single automation rule by its UUID.",
)
def get_rule(
    rule_id: str,
    db: Session = Depends(get_db),
    svc: RuleService = Depends(get_rule_service),
    scope: AccessScope = Depends(get_access_scope),
) -> RuleResponse:
    TenantGuard.rule(db, rule_id, scope)
    return svc.get_rule(db, rule_id)


@router.patch(
    "/rules/{rule_id}",
    response_model=RuleResponse,
    summary="Partially update a rule",
    description="Update condition thresholds, severity, enabled state, or action configurations.",
)
def update_rule(
    rule_id: str,
    payload: RuleUpdate,
    db: Session = Depends(get_db),
    svc: RuleService = Depends(get_rule_service),
    scope: AccessScope = Depends(get_access_scope),
) -> RuleResponse:
    TenantGuard.rule(db, rule_id, scope)
    return svc.update_rule(db, rule_id, payload)


@router.delete(
    "/rules/{rule_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Soft-delete a rule",
    description="Deactivate an automation rule.",
)
def deactivate_rule(
    rule_id: str,
    db: Session = Depends(get_db),
    svc: RuleService = Depends(get_rule_service),
    scope: AccessScope = Depends(get_access_scope),
) -> None:
    TenantGuard.rule(db, rule_id, scope)
    svc.deactivate_rule(db, rule_id)
