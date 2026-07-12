"""
app/modules/dashboards/repositories/dashboard_repository.py

Dashboard repository layer.
"""

from sqlalchemy import select, and_, or_, func
from sqlalchemy.orm import Session

from app.shared.repositories.base_repository import BaseRepository
from app.modules.dashboards.models.dashboard import Dashboard
from app.modules.dashboards.schemas.dashboard import DashboardFilter


class DashboardRepository(BaseRepository[Dashboard]):

    def __init__(self):
        super().__init__(Dashboard)

    def exists_by_code(self, db: Session, project_id: str, code: str) -> bool:
        """Check if a dashboard code already exists in this project."""
        stmt = select(func.count(Dashboard.id)).where(
            and_(
                Dashboard.project_id == project_id,
                Dashboard.code == code,
            )
        )
        return db.scalar(stmt) > 0

    def list_by_project(
        self,
        db: Session,
        project_id: str,
        filters: DashboardFilter,
        page: int,
        page_size: int,
    ) -> tuple[int, list[Dashboard]]:
        """List dashboards for a project with optional filters and pagination."""
        stmt = select(Dashboard).where(Dashboard.project_id == project_id)

        if filters.status:
            stmt = stmt.where(Dashboard.status == filters.status)

        if filters.search:
            search_clause = f"%{filters.search}%"
            stmt = stmt.where(
                or_(
                    Dashboard.code.ilike(search_clause),
                    Dashboard.name.ilike(search_clause),
                )
            )

        # Count total
        count_stmt = select(func.count()).select_from(stmt.subquery())
        total = db.scalar(count_stmt) or 0

        # Offset and limit
        offset = (page - 1) * page_size
        stmt = stmt.offset(offset).limit(page_size)

        items = list(db.scalars(stmt).all())
        return total, items
