"""
app/modules/widgets/services/widget_service.py

Widget business service layer.
"""

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.shared.services.base_service import BaseService
from app.modules.dashboards.models.dashboard import Dashboard
from app.shared.exceptions.dashboard import DashboardNotFound
from app.shared.exceptions.widget import WidgetNotFound, WidgetCodeConflict
from app.modules.widgets.models.widget import Widget
from app.modules.widgets.repositories.widget_repository import WidgetRepository
from app.modules.widgets.schemas.widget import (
    WidgetCreate,
    WidgetUpdate,
)


class WidgetService(BaseService[Widget, WidgetRepository]):

    def __init__(self, repository: WidgetRepository):
        super().__init__(repository)
        self.repository = repository

    def create_widget(
        self,
        db: Session,
        dashboard_id: str,
        schema: WidgetCreate,
    ) -> Widget:
        """Create a new widget inside an active dashboard container."""
        # 1. Verify dashboard exists and is active
        dashboard = db.scalar(select(Dashboard).where(Dashboard.id == dashboard_id))
        if not dashboard or not dashboard.is_active:
            raise DashboardNotFound()

        # 2. Check for code conflict inside this dashboard
        if self.repository.exists_by_code(db, dashboard_id, schema.code):
            raise WidgetCodeConflict()

        # 3. Instantiate model
        widget = Widget(
            dashboard_id=dashboard_id,
            code=schema.code,
            name=schema.name,
            title=schema.title,
            description=schema.description,
            widget_type=schema.widget_type.value,
            data_source=schema.data_source,
            query_config=schema.query_config,
            display_config=schema.display_config,
            refresh_interval=schema.refresh_interval,
            position_x=schema.position_x,
            position_y=schema.position_y,
            width=schema.width,
            height=schema.height,
            status="ACTIVE",
            is_active=True,
        )

        return self.repository.create(db, widget)

    def get_widget(self, db: Session, widget_id: str) -> Widget:
        """Fetch widget details. Raises WidgetNotFound if missing or inactive."""
        widget = self.repository.get_by_id(db, widget_id)
        if not widget or not widget.is_active:
            raise WidgetNotFound()
        return widget

    def list_widgets(self, db: Session, dashboard_id: str) -> list[Widget]:
        """List active widgets for a dashboard."""
        dashboard = db.scalar(select(Dashboard).where(Dashboard.id == dashboard_id))
        if not dashboard or not dashboard.is_active:
            raise DashboardNotFound()

        return self.repository.list_by_dashboard(db, dashboard_id)

    def update_widget(
        self,
        db: Session,
        widget_id: str,
        schema: WidgetUpdate,
    ) -> Widget:
        """Update widget attributes."""
        widget = self.get_widget(db, widget_id)

        # Update fields
        update_data = schema.model_dump(exclude_unset=True)
        for key, val in update_data.items():
            if key == "widget_type" and val is not None:
                setattr(widget, key, val.value)
            else:
                setattr(widget, key, val)

        # Check soft deactivation if status set to INACTIVE
        if schema.status == "INACTIVE":
            widget.is_active = False

        return self.repository.update(db, widget)

    def deactivate_widget(self, db: Session, widget_id: str) -> None:
        """Soft-deactivates the widget."""
        widget = self.get_widget(db, widget_id)
        widget.status = "INACTIVE"
        widget.is_active = False
        self.repository.update(db, widget)
