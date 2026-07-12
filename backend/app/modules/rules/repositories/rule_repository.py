"""
app/modules/rules/repositories/rule_repository.py

Rule repository layer.
"""

from sqlalchemy import select, and_, or_, func
from sqlalchemy.orm import Session

from app.shared.repositories.base_repository import BaseRepository
from app.modules.rules.models.rule import Rule
from app.modules.rules.schemas.rule import RuleFilter


class RuleRepository(BaseRepository[Rule]):

    def __init__(self):
        super().__init__(Rule)

    def exists_by_code(self, db: Session, project_id: str, code: str) -> bool:
        """Check if a rule code already exists in this project."""
        stmt = select(func.count(Rule.id)).where(
            and_(
                Rule.project_id == project_id,
                Rule.code == code,
            )
        )
        return db.scalar(stmt) > 0

    def list_by_project(
        self,
        db: Session,
        project_id: str,
        filters: RuleFilter,
        page: int,
        page_size: int,
    ) -> tuple[int, list[Rule]]:
        """List rules for a project with optional filters and pagination."""
        stmt = select(Rule).where(Rule.project_id == project_id)

        if filters.status:
            stmt = stmt.where(Rule.status == filters.status)

        if filters.enabled is not None:
            stmt = stmt.where(Rule.enabled == filters.enabled)

        if filters.search:
            search_clause = f"%{filters.search}%"
            stmt = stmt.where(
                or_(
                    Rule.code.ilike(search_clause),
                    Rule.name.ilike(search_clause),
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

    def get_active_rules_for_sensor(self, db: Session, sensor_id: str) -> list[Rule]:
        """Fetch all enabled and active rules for a specific sensor."""
        stmt = select(Rule).where(
            and_(
                Rule.sensor_id == sensor_id,
                Rule.enabled == True,
                Rule.status == "ACTIVE",
                Rule.is_active == True,
            )
        )
        return list(db.scalars(stmt).all())
