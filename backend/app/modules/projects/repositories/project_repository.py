"""
app/modules/projects/repositories/project_repository.py

All SQL queries for the Project module.

No business logic lives here — only clean SQLAlchemy queries.
"""

from sqlalchemy import and_, func, or_, select
from sqlalchemy.orm import Session

from app.modules.projects.models.project import Project
from app.shared.repositories.base_repository import BaseRepository


class ProjectRepository(BaseRepository[Project]):

    def __init__(self):
        super().__init__(Project)

    # ── Single-row lookups ────────────────────────────────────────────────────

    def get_by_code(
        self,
        db: Session,
        tenant_id: str,
        code: str,
    ) -> Project | None:
        """
        Fetch a project by (tenant_id, code).

        code is unique only within a tenant, so both columns are required.
        """
        stmt = select(Project).where(
            and_(
                Project.tenant_id == tenant_id,
                Project.code == code,
            )
        )
        return db.scalar(stmt)

    # ── Existence checks (cheap COUNT — no row hydration) ────────────────────

    def exists_by_code(
        self,
        db: Session,
        tenant_id: str,
        code: str,
    ) -> bool:
        """
        Return True if any project in this tenant already uses this code.
        Used by create_project() to enforce the composite uniqueness rule.
        """
        stmt = select(func.count()).select_from(Project).where(
            and_(
                Project.tenant_id == tenant_id,
                Project.code == code,
            )
        )
        return db.scalar(stmt) > 0

    # ── Filtered + paginated list ─────────────────────────────────────────────

    def list_by_tenant(
        self,
        db: Session,
        tenant_id: str,
        keyword: str | None = None,
        status: str | None = None,
        page: int = 1,
        page_size: int = 20,
    ) -> tuple[list[Project], int]:
        """
        Return a paginated list of projects belonging to a tenant.

        keyword  — LIKE search across name and code
        status   — exact match on the status column (e.g. "ACTIVE")
        """
        stmt = select(Project).where(
            Project.tenant_id == tenant_id
        )

        if keyword:
            pattern = f"%{keyword}%"
            stmt = stmt.where(
                or_(
                    Project.name.ilike(pattern),
                    Project.code.ilike(pattern),
                )
            )

        if status:
            stmt = stmt.where(Project.status == status)

        # Count before pagination
        count_stmt = select(func.count()).select_from(stmt.subquery())
        total: int = db.scalar(count_stmt)

        stmt = (
            stmt
            .order_by(Project.name)
            .offset((page - 1) * page_size)
            .limit(page_size)
        )
        items = list(db.scalars(stmt).all())

        return items, total

    # ── Soft-delete ───────────────────────────────────────────────────────────

    def deactivate(self, db: Session, project: Project) -> Project:
        """
        Soft-delete: set is_active = False and status = INACTIVE.
        The row is preserved for audit trails and FK integrity.
        Never calls db.delete().
        """
        project.is_active = False
        project.status = "INACTIVE"
        db.commit()
        db.refresh(project)
        return project
