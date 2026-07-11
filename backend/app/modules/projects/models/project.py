"""
app/modules/projects/models/project.py

Project — a logical grouping/container for IoT assets (gateways, devices, telemetry).
Every project belongs to a Tenant.
"""

from __future__ import annotations

from sqlalchemy import ForeignKey, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from typing import TYPE_CHECKING

from app.database.base import BaseModel

if TYPE_CHECKING:
    from app.modules.gateways.models.gateway import Gateway


class Project(BaseModel):
    __tablename__ = "projects"

    # ── Composite Unique Constraint ──────────────────────────────────────────
    # code is unique within a tenant, not globally.
    __table_args__ = (
        UniqueConstraint(
            "tenant_id",
            "code",
            name="uq_project_tenant_code",
        ),
    )

    # ── Parent ───────────────────────────────────────────────────────────────
    # UUID FK → tenants.id
    tenant_id: Mapped[str] = mapped_column(
        ForeignKey("tenants.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )

    # ── Identity ─────────────────────────────────────────────────────────────
    # code is NOT globally unique — uniqueness is scoped to tenant_id
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

    # ── Status ───────────────────────────────────────────────────────────────
    status: Mapped[str] = mapped_column(
        String(20),
        default="ACTIVE",
        nullable=False,
        index=True,
    )

    # ── Relationships ─────────────────────────────────────────────────────────
    tenant: Mapped["Tenant"] = relationship(  # type: ignore[name-defined]
        "Tenant",
        back_populates="projects",
    )

    gateways: Mapped[list[Gateway]] = relationship(
        "Gateway",
        back_populates="project",
        cascade="all, delete-orphan",
        lazy="select",
    )

