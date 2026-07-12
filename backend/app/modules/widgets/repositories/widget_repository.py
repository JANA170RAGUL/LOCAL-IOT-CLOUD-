"""
app/modules/widgets/repositories/widget_repository.py

Widget repository layer.
"""

from sqlalchemy import select, and_, func
from sqlalchemy.orm import Session

from app.shared.repositories.base_repository import BaseRepository
from app.modules.widgets.models.widget import Widget


class WidgetRepository(BaseRepository[Widget]):

    def __init__(self):
        super().__init__(Widget)

    def exists_by_code(self, db: Session, dashboard_id: str, code: str) -> bool:
        """Check if a widget code already exists in this dashboard."""
        stmt = select(func.count(Widget.id)).where(
            and_(
                Widget.dashboard_id == dashboard_id,
                Widget.code == code,
            )
        )
        return db.scalar(stmt) > 0

    def list_by_dashboard(self, db: Session, dashboard_id: str) -> list[Widget]:
        """List all active widgets under a dashboard."""
        stmt = select(Widget).where(Widget.dashboard_id == dashboard_id)
        return list(db.scalars(stmt).all())
