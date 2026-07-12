"""
app/modules/dashboards/models/dashboard.py

Dashboard model representation in SQLAlchemy.
"""

from __future__ import annotations

from typing import TYPE_CHECKING
from sqlalchemy import ForeignKey, String, Text, UniqueConstraint, Boolean, Integer, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import BaseModel

if TYPE_CHECKING:
    from app.modules.projects.models.project import Project
    from app.modules.widgets.models.widget import Widget


class Dashboard(BaseModel):
    __tablename__ = "dashboards"

    # Foreign Key
    project_id: Mapped[str] = mapped_column(
        ForeignKey("projects.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )

    # Basic Info
    code: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
    )
    name: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
        index=True,
    )
    description: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    # Configuration & Styling
    layout: Mapped[dict | list | None] = mapped_column(
        JSON,
        nullable=True,
    )
    theme: Mapped[str | None] = mapped_column(
        String(50),
        nullable=True,
    )
    is_public: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=False,
    )
    refresh_interval: Mapped[int | None] = mapped_column(
        Integer,
        nullable=True,
    )

    # Status
    status: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
        default="ACTIVE",
        index=True,
    )
    is_active: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=True,
        index=True,
    )

    # Composite constraints
    __table_args__ = (
        UniqueConstraint("project_id", "code", name="uq_dashboard_project_code"),
    )

    # Relationships
    project: Mapped[Project] = relationship(
        "Project",
        back_populates="dashboards",
    )
    
    widgets: Mapped[list[Widget]] = relationship(
        "Widget",
        back_populates="dashboard",
        cascade="all, delete-orphan",
        lazy="select",
    )
