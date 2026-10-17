"""
app/modules/tenants/repositories/tenant_repository.py

All SQL queries for the Tenant module.

Naming convention (effective from Tenant module):
  - get_by_*      — return a single row or None
  - exists_by_*   — cheap COUNT, returns bool
  - list_by_*     — return filtered + paginated rows
  - deactivate    — soft-delete, never physical removal

No business logic lives here — only SQLAlchemy statements.
"""

from sqlalchemy import and_, func, or_, select
from sqlalchemy.orm import Session

from app.modules.tenants.models.tenant import Tenant
from app.shared.repositories.base_repository import BaseRepository


class TenantRepository(BaseRepository[Tenant]):

    def __init__(self):
        super().__init__(Tenant)

    # ── Single-row lookups ────────────────────────────────────────────────────

    def get_by_code(
        self,
        db: Session,
        organization_id: str,
        code: str,
    ) -> Tenant | None:
        """
        Fetch a tenant by (organization_id, code).

        code is unique only within an organization, so both columns are required.
        """
        stmt = select(Tenant).where(
            and_(
                Tenant.organization_id == organization_id,
                Tenant.code == code,
            )
        )
        return db.scalar(stmt)

    # ── Existence checks (cheap COUNT — no row hydration) ────────────────────

    def exists_by_code(
        self,
        db: Session,
        organization_id: str,
        code: str,
    ) -> bool:
        """
        Return True if any tenant in this organization already uses this code.
        Used by create_tenant() to enforce the composite uniqueness rule.
        """
        stmt = select(func.count()).select_from(Tenant).where(
            and_(
                Tenant.organization_id == organization_id,
                Tenant.code == code,
            )
        )
        return (db.scalar(stmt) or 0) > 0

    def exists_by_email(
        self,
        db: Session,
        email: str,
        exclude_id: str | None = None,
    ) -> bool:
        """
        Return True if any tenant already uses this email address.

        exclude_id — pass the current tenant's id to allow updating
                     the email to its own existing value without conflict.
        """
        stmt = select(func.count()).select_from(Tenant).where(
            Tenant.email == email
        )
        if exclude_id:
            stmt = stmt.where(Tenant.id != exclude_id)
        return (db.scalar(stmt) or 0) > 0

    # ── Filtered + paginated list ─────────────────────────────────────────────

    def list_by_organization(
        self,
        db: Session,
        organization_id: str,
        keyword: str | None = None,
        status: str | None = None,
        page: int = 1,
        page_size: int = 20,
        allowed_tenant_id: str | None = None,
    ) -> tuple[list[Tenant], int]:
        """
        Return a paginated list of tenants belonging to an organization.

        keyword           — LIKE search across name, code, and email
        status            — exact match on the status column (e.g. "ACTIVE")
        allowed_tenant_id — restrict list to a single tenant ID if set
        """
        stmt = select(Tenant).where(
            Tenant.organization_id == organization_id
        )

        if allowed_tenant_id:
            stmt = stmt.where(Tenant.id == allowed_tenant_id)

        if keyword:
            pattern = f"%{keyword}%"
            stmt = stmt.where(
                or_(
                    Tenant.name.ilike(pattern),
                    Tenant.code.ilike(pattern),
                    Tenant.email.ilike(pattern),
                )
            )

        if status:
            stmt = stmt.where(Tenant.status == status)

        # Count before pagination
        count_stmt = select(func.count()).select_from(stmt.subquery())
        total: int = db.scalar(count_stmt) or 0

        stmt = (
            stmt
            .order_by(Tenant.name)
            .offset((page - 1) * page_size)
            .limit(page_size)
        )
        items = list(db.scalars(stmt).all())

        return items, total

    # ── Soft-delete ───────────────────────────────────────────────────────────

    def deactivate(self, db: Session, tenant: Tenant) -> Tenant:
        """
        Soft-delete: set is_active = False and status = INACTIVE.
        The row is preserved for audit trails and FK integrity.
        Never calls db.delete().
        """
        tenant.is_active = False
        tenant.status = "INACTIVE"
        db.commit()
        db.refresh(tenant)
        return tenant
