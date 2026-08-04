from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.modules.organizations.models.organization import Organization
from app.shared.repositories.base_repository import BaseRepository


class OrganizationRepository(BaseRepository[Organization]):

    def __init__(self):
        super().__init__(Organization)

    # ── Lookups ──────────────────────────────────────────────────────────────

    def get_by_code(self, db: Session, code: str) -> Organization | None:
        stmt = select(Organization).where(Organization.code == code)
        return db.scalar(stmt)

    def get_by_email(self, db: Session, email: str) -> Organization | None:
        stmt = select(Organization).where(Organization.email == email)
        return db.scalar(stmt)

    # ── Existence checks (cheap COUNT — no row hydration) ────────────────────

    def exists_by_code(self, db: Session, code: str) -> bool:
        stmt = select(func.count()).select_from(Organization).where(
            Organization.code == code
        )
        return db.scalar(stmt) > 0

    def exists_by_email(self, db: Session, email: str) -> bool:
        stmt = select(func.count()).select_from(Organization).where(
            Organization.email == email
        )
        return db.scalar(stmt) > 0

    # ── Search / filter (paginated) ──────────────────────────────────────────

    def search(
        self,
        db: Session,
        keyword: str | None = None,
        status: str | None = None,
        license_type: str | None = None,
        page: int = 1,
        page_size: int = 20,
        allowed_org_ids: list[str] | None = None,
    ) -> tuple[list[Organization], int]:
        """
        Return a page of organizations filtered by optional keyword and status.

        keyword  — LIKE search across name, code, and email
        status   — exact match on the status column (e.g. "ACTIVE")
        """
        stmt = select(Organization)

        if keyword:
            pattern = f"%{keyword}%"
            stmt = stmt.where(
                Organization.name.ilike(pattern)
                | Organization.code.ilike(pattern)
                | Organization.email.ilike(pattern)
            )

        if status:
            stmt = stmt.where(Organization.status == status)

        if license_type:
            stmt = stmt.where(Organization.license_type == license_type)

        if allowed_org_ids is not None:
            stmt = stmt.where(Organization.id.in_(allowed_org_ids))

        # Count before pagination
        count_stmt = select(func.count()).select_from(stmt.subquery())
        total: int = db.scalar(count_stmt)

        stmt = stmt.order_by(Organization.name).offset((page - 1) * page_size).limit(page_size)
        items = list(db.scalars(stmt).all())

        return items, total

    # ── Active set ───────────────────────────────────────────────────────────

    def get_active(self, db: Session) -> list[Organization]:
        """Return every organization that has not been soft-deleted."""
        stmt = select(Organization).where(Organization.is_active == True)  # noqa: E712
        return list(db.scalars(stmt).all())

    # ── Soft-delete ──────────────────────────────────────────────────────────

    def deactivate(self, db: Session, org: Organization) -> Organization:
        """
        Soft-delete: mark the record inactive instead of removing it.
        Preserves all historical data and foreign-key references.
        """
        org.is_active = False
        org.status = "INACTIVE"
        db.commit()
        db.refresh(org)
        return org
