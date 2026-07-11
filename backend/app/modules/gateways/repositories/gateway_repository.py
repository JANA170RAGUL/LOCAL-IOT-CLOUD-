"""
app/modules/gateways/repositories/gateway_repository.py

All SQL queries for the Gateway module.

No business logic lives here — only clean SQLAlchemy queries.
"""

from sqlalchemy import and_, func, or_, select
from sqlalchemy.orm import Session

from app.modules.gateways.models.gateway import Gateway
from app.shared.repositories.base_repository import BaseRepository


class GatewayRepository(BaseRepository[Gateway]):

    def __init__(self):
        super().__init__(Gateway)

    # ── Single-row lookups ────────────────────────────────────────────────────

    def get_by_code(
        self,
        db: Session,
        project_id: str,
        code: str,
    ) -> Gateway | None:
        """
        Fetch a gateway by (project_id, code).

        code is unique only within a project, so both columns are required.
        """
        stmt = select(Gateway).where(
            and_(
                Gateway.project_id == project_id,
                Gateway.code == code,
            )
        )
        return db.scalar(stmt)

    # ── Existence checks (cheap COUNT — no row hydration) ────────────────────

    def exists_by_code(
        self,
        db: Session,
        project_id: str,
        code: str,
    ) -> bool:
        """
        Return True if any gateway in this project already uses this code.
        Used by create_gateway() to enforce the composite uniqueness rule.
        """
        stmt = select(func.count()).select_from(Gateway).where(
            and_(
                Gateway.project_id == project_id,
                Gateway.code == code,
            )
        )
        return db.scalar(stmt) > 0

    # ── Filtered + paginated list ─────────────────────────────────────────────

    def list_by_project(
        self,
        db: Session,
        project_id: str,
        keyword: str | None = None,
        status: str | None = None,
        protocol: str | None = None,
        page: int = 1,
        page_size: int = 20,
    ) -> tuple[list[Gateway], int]:
        """
        Return a paginated list of gateways belonging to a project.

        keyword  — LIKE search across name and code
        status   — exact match on the status column (e.g. "ACTIVE")
        protocol — exact match on the protocol column (e.g. "MQTT")
        """
        stmt = select(Gateway).where(
            Gateway.project_id == project_id
        )

        if keyword:
            pattern = f"%{keyword}%"
            stmt = stmt.where(
                or_(
                    Gateway.name.ilike(pattern),
                    Gateway.code.ilike(pattern),
                )
            )

        if status:
            stmt = stmt.where(Gateway.status == status)

        if protocol:
            stmt = stmt.where(Gateway.protocol == protocol)

        # Count before pagination
        count_stmt = select(func.count()).select_from(stmt.subquery())
        total: int = db.scalar(count_stmt)

        stmt = (
            stmt
            .order_by(Gateway.name)
            .offset((page - 1) * page_size)
            .limit(page_size)
        )
        items = list(db.scalars(stmt).all())

        return items, total

    # ── Soft-delete ───────────────────────────────────────────────────────────

    def deactivate(self, db: Session, gateway: Gateway) -> Gateway:
        """
        Soft-delete: set is_active = False and status = INACTIVE.
        The row is preserved for audit trails and FK integrity.
        Never calls db.delete().
        """
        gateway.is_active = False
        gateway.status = "INACTIVE"
        db.commit()
        db.refresh(gateway)
        return gateway
