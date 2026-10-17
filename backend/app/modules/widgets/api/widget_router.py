"""
app/modules/widgets/api/widget_router.py

FastAPI router for Widget endpoints.
"""

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.modules.widgets.dependencies import get_widget_service
from app.modules.widgets.models.widget import Widget
from app.modules.licensing.dependencies import check_feature_limit
from app.modules.widgets.schemas.widget import (
    WidgetCreate,
    WidgetUpdate,
    WidgetResponse,
    WidgetListResponse,
)
from app.modules.widgets.services.widget_service import WidgetService

from app.core.access_scope import AccessScope, get_access_scope
from app.core.tenant_guard import TenantGuard

router = APIRouter(
    tags=["Widgets"],
)


@router.post(
    "/dashboards/{dashboard_id}/widgets",
    response_model=WidgetResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new widget",
    description="Registers a widget inside a dashboard container.",
)
def create_widget(
    dashboard_id: str,
    payload: WidgetCreate,
    db: Session = Depends(get_db),
    svc: WidgetService = Depends(get_widget_service),
    scope: AccessScope = Depends(get_access_scope),
) -> WidgetResponse:
    TenantGuard.dashboard(db, dashboard_id, scope)
    # License limit check
    current_count = db.query(Widget).count()
    check_feature_limit("widgets", current_count)

    return svc.create_widget(db, dashboard_id, payload)


@router.get(
    "/dashboards/{dashboard_id}/widgets",
    response_model=WidgetListResponse,
    summary="List widgets for dashboard",
    description="Fetch list of widgets configured under a dashboard.",
)
def list_widgets(
    dashboard_id: str,
    db: Session = Depends(get_db),
    svc: WidgetService = Depends(get_widget_service),
    scope: AccessScope = Depends(get_access_scope),
) -> WidgetListResponse:
    TenantGuard.dashboard(db, dashboard_id, scope)
    items = svc.list_widgets(db, dashboard_id)
    return WidgetListResponse(
        total=len(items),
        items=items,
    )


@router.get(
    "/widgets/{widget_id}",
    response_model=WidgetResponse,
    summary="Get widget details",
    description="Retrieve details of a single widget by its UUID.",
)
def get_widget(
    widget_id: str,
    db: Session = Depends(get_db),
    svc: WidgetService = Depends(get_widget_service),
    scope: AccessScope = Depends(get_access_scope),
) -> WidgetResponse:
    TenantGuard.widget(db, widget_id, scope)
    return svc.get_widget(db, widget_id)


@router.patch(
    "/widgets/{widget_id}",
    response_model=WidgetResponse,
    summary="Partially update a widget",
    description="Update positioning, display settings, query metrics, or status attributes.",
)
def update_widget(
    widget_id: str,
    payload: WidgetUpdate,
    db: Session = Depends(get_db),
    svc: WidgetService = Depends(get_widget_service),
    scope: AccessScope = Depends(get_access_scope),
) -> WidgetResponse:
    TenantGuard.widget(db, widget_id, scope)
    return svc.update_widget(db, widget_id, payload)


@router.delete(
    "/widgets/{widget_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Soft-delete a widget",
    description="Deactivate a widget panel. Keeps time-series data intact.",
)
def deactivate_widget(
    widget_id: str,
    db: Session = Depends(get_db),
    svc: WidgetService = Depends(get_widget_service),
    scope: AccessScope = Depends(get_access_scope),
) -> None:
    TenantGuard.widget(db, widget_id, scope)
    svc.deactivate_widget(db, widget_id)
