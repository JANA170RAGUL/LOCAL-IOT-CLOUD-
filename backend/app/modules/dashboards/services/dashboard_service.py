"""
app/modules/dashboards/services/dashboard_service.py

Dashboard business service layer.
"""

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.shared.services.base_service import BaseService
from app.modules.projects.models.project import Project
from app.shared.exceptions.project import ProjectNotFound
from app.shared.exceptions.dashboard import DashboardNotFound, DashboardCodeConflict
from app.modules.dashboards.models.dashboard import Dashboard
from app.modules.dashboards.repositories.dashboard_repository import DashboardRepository
from app.modules.dashboards.schemas.dashboard import (
    DashboardCreate,
    DashboardUpdate,
    DashboardFilter,
)


from app.modules.licensing.features import LicenseFeature
from app.modules.licensing.services.license_policy import license_policy
from app.modules.licensing.services.license_usage import license_usage


class DashboardService(BaseService[Dashboard, DashboardRepository]):

    def __init__(self, repository: DashboardRepository):
        super().__init__(repository)
        self.repository = repository

    def create_dashboard(
        self,
        db: Session,
        project_id: str,
        schema: DashboardCreate,
    ) -> Dashboard:
        """Create a new dashboard under an active project."""
        snapshot = license_policy.get_snapshot(db)
        current_count = license_usage.count_dashboards(db)
        license_policy.ensure_capacity(
            snapshot,
            LicenseFeature.DASHBOARDS,
            current_count=current_count,
        )

        # 1. Verify project exists and is active
        project = db.scalar(select(Project).where(Project.id == project_id))
        if not project or not project.is_active:
            raise ProjectNotFound()

        # 2. Check for code conflict inside this project
        if self.repository.exists_by_code(db, project_id, schema.code):
            raise DashboardCodeConflict()

        # 3. Instantiate model
        dashboard = Dashboard(
            project_id=project_id,
            code=schema.code,
            name=schema.name,
            description=schema.description,
            layout=schema.layout,
            theme=schema.theme,
            is_public=schema.is_public,
            refresh_interval=schema.refresh_interval,
            status="ACTIVE",
            is_active=True,
        )

        return self.repository.create(db, dashboard)

    def get_dashboard(self, db: Session, dashboard_id: str) -> Dashboard:
        """Fetch dashboard details. Raises DashboardNotFound if missing or inactive."""
        dashboard = self.repository.get_by_id(db, dashboard_id)
        if not dashboard or not dashboard.is_active:
            raise DashboardNotFound()
        return dashboard

    def list_dashboards(
        self,
        db: Session,
        project_id: str,
        filters: DashboardFilter,
        page: int,
        page_size: int,
    ) -> tuple[int, list[Dashboard]]:
        """List dashboards for a project with filters."""
        # Verify project exists
        project = db.scalar(select(Project).where(Project.id == project_id))
        if not project or not project.is_active:
            raise ProjectNotFound()

        return self.repository.list_by_project(db, project_id, filters, page, page_size)

    def update_dashboard(
        self,
        db: Session,
        dashboard_id: str,
        schema: DashboardUpdate,
    ) -> Dashboard:
        """Update dashboard attributes."""
        dashboard = self.get_dashboard(db, dashboard_id)

        # Update fields
        update_data = schema.model_dump(exclude_unset=True)
        for key, val in update_data.items():
            setattr(dashboard, key, val)

        # Check soft deactivation if status set to INACTIVE
        if schema.status == "INACTIVE":
            dashboard.is_active = False

        return self.repository.update(db, dashboard)

    def deactivate_dashboard(self, db: Session, dashboard_id: str) -> None:
        """Soft-deactivates the dashboard and its widgets cascade down."""
        dashboard = self.get_dashboard(db, dashboard_id)
        
        # Soft delete dashboard
        dashboard.status = "INACTIVE"
        dashboard.is_active = False

        # Soft delete child widgets
        for widget in dashboard.widgets:
            widget.status = "INACTIVE"
            widget.is_active = False

        self.repository.update(db, dashboard)
