"""
app/modules/dashboards/api/dashboard_router.py

FastAPI router for Dashboard endpoints.
"""

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.core.constants import DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE
from app.database.session import get_db
from app.modules.dashboards.dependencies import get_dashboard_service
from app.modules.dashboards.models.dashboard import Dashboard
from app.modules.licensing.dependencies import check_feature_limit
from app.modules.dashboards.schemas.dashboard import (
    DashboardCreate,
    DashboardUpdate,
    DashboardResponse,
    DashboardFilter,
    DashboardListResponse,
)
from app.modules.dashboards.services.dashboard_service import DashboardService

router = APIRouter(
    tags=["Dashboards"],
)


@router.post(
    "/projects/{project_id}/dashboards",
    response_model=DashboardResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new dashboard",
    description="Registers a dashboard inside a project container.",
)
def create_dashboard(
    project_id: str,
    payload: DashboardCreate,
    db: Session = Depends(get_db),
    svc: DashboardService = Depends(get_dashboard_service),
) -> DashboardResponse:
    # License limit check
    current_count = db.query(Dashboard).filter(Dashboard.is_active == True).count()
    check_feature_limit("dashboards", current_count)

    return svc.create_dashboard(db, project_id, payload)


@router.get(
    "/projects/{project_id}/dashboards",
    response_model=DashboardListResponse,
    summary="List dashboards for project",
    description="Fetch paginated list of dashboards under a project with optional code/name filtering.",
)
def list_dashboards(
    project_id: str,
    status_filter: str | None = Query(None, alias="status", description="Filter by status (e.g. ACTIVE, INACTIVE)"),
    search: str | None = Query(None, description="Search term for name or code"),
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(DEFAULT_PAGE_SIZE, ge=1, le=MAX_PAGE_SIZE, alias="page_size", description="Items per page"),
    db: Session = Depends(get_db),
    svc: DashboardService = Depends(get_dashboard_service),
) -> DashboardListResponse:
    filters = DashboardFilter(status=status_filter, search=search)
    total, items = svc.list_dashboards(db, project_id, filters, page, page_size)
    return DashboardListResponse(
        total=total,
        page=page,
        page_size=page_size,
        items=items,
    )


@router.get(
    "/dashboards/{dashboard_id}",
    response_model=DashboardResponse,
    summary="Get dashboard details",
    description="Retrieve details of a single dashboard by its UUID.",
)
def get_dashboard(
    dashboard_id: str,
    db: Session = Depends(get_db),
    svc: DashboardService = Depends(get_dashboard_service),
) -> DashboardResponse:
    return svc.get_dashboard(db, dashboard_id)


@router.patch(
    "/dashboards/{dashboard_id}",
    response_model=DashboardResponse,
    summary="Partially update a dashboard",
    description="Update layout coordinates, names, theme, or status attributes.",
)
def update_dashboard(
    dashboard_id: str,
    payload: DashboardUpdate,
    db: Session = Depends(get_db),
    svc: DashboardService = Depends(get_dashboard_service),
) -> DashboardResponse:
    return svc.update_dashboard(db, dashboard_id, payload)


@router.delete(
    "/dashboards/{dashboard_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Soft-delete a dashboard",
    description="Deactivate a dashboard and its contained widgets. Keeps time-series data intact.",
)
def deactivate_dashboard(
    dashboard_id: str,
    db: Session = Depends(get_db),
    svc: DashboardService = Depends(get_dashboard_service),
) -> None:
    svc.deactivate_dashboard(db, dashboard_id)
