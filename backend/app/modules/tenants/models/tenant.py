"""
app/modules/tenants/models/tenant.py

Tenant — a logical sub-division of an Organization.

Hierarchy
---------
Organization (1)
    └── Tenant (many)
            └── User / Device / Gateway / Project (many)

A Tenant represents a distinct operational unit within an Organization.
Example: a university (Organization) might have separate Tenants for
each faculty — Engineering, Medicine, Arts — each with its own users,
devices, and projects, while sharing the same license.

Design decisions
----------------
- organization_id is a UUID (CHAR 36) foreign key, consistent with the
  platform-wide identifier strategy.
- code is unique per organization (composite constraint), not globally.
  Two different orgs may both have a tenant coded "LAB01".
- status mirrors the Organization pattern (str enum, not bool).
- No physical deletes: is_active (BaseModel) is the soft-delete flag.
"""

from __future__ import annotations

from sqlalchemy import ForeignKey, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from typing import TYPE_CHECKING

from app.database.base import BaseModel

if TYPE_CHECKING:
    from app.modules.projects.models.project import Project


class Tenant(BaseModel):
    __tablename__ = "tenants"

    # ── Composite unique constraint ──────────────────────────────────────────
    # code must be unique within an organization, not globally.
    __table_args__ = (
        UniqueConstraint(
            "organization_id",
            "code",
            name="uq_tenant_org_code",
        ),
    )

    # ── Parent ───────────────────────────────────────────────────────────────
    # UUID FK → organizations.id
    organization_id: Mapped[str] = mapped_column(
        ForeignKey("organizations.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )

    # ── Identity ─────────────────────────────────────────────────────────────
    # code is NOT globally unique — uniqueness is scoped to organization_id
    # via the uq_tenant_org_code composite constraint above.
    code: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
    )

    name: Mapped[str] = mapped_column(
        String(150),
        nullable=False,
        index=True,
    )

    description: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    logo_url: Mapped[str | None] = mapped_column(
        String(500),
        nullable=True,
    )

    # ── Contact ──────────────────────────────────────────────────────────────
    email: Mapped[str] = mapped_column(
        String(150),
        nullable=False,
    )

    phone: Mapped[str | None] = mapped_column(
        String(20),
        nullable=True,
    )

    website: Mapped[str | None] = mapped_column(
        String(255),
        nullable=True,
    )

    # ── Location ─────────────────────────────────────────────────────────────
    address: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    city: Mapped[str | None] = mapped_column(
        String(100),
        nullable=True,
    )

    state: Mapped[str | None] = mapped_column(
        String(100),
        nullable=True,
    )

    country: Mapped[str | None] = mapped_column(
        String(100),
        nullable=True,
    )

    # ── Locale ───────────────────────────────────────────────────────────────
    # Inherits from the parent Organization by convention; can be overridden
    # at the tenant level to support multi-region deployments.
    timezone: Mapped[str] = mapped_column(
        String(100),
        default="Asia/Kolkata",
    )

    # ── Status ───────────────────────────────────────────────────────────────
    # Valid values: ACTIVE | INACTIVE | SUSPENDED | TRIAL | EXPIRED
    # is_active (BaseModel) remains the soft-delete / enabled flag.
    status: Mapped[str] = mapped_column(
        String(20),
        default="ACTIVE",
        nullable=False,
        index=True,
    )

    # ── Relationships ─────────────────────────────────────────────────────────
    organization: Mapped["Organization"] = relationship(  # type: ignore[name-defined]
        "Organization",
        back_populates="tenants",
    )

    projects: Mapped[list[Project]] = relationship(
        "Project",
        back_populates="tenant",
        cascade="all, delete-orphan",
        lazy="select",
    )

