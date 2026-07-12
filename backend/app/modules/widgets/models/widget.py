"""
app/modules/widgets/models/widget.py

Widget model representation in SQLAlchemy.
"""

from __future__ import annotations

from typing import TYPE_CHECKING
from sqlalchemy import ForeignKey, String, Text, UniqueConstraint, Boolean, Integer, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import BaseModel

if TYPE_CHECKING:
    from app.modules.dashboards.models.dashboard import Dashboard


class Widget(BaseModel):
    __tablename__ = "widgets"

    # Foreign Key
    dashboard_id: Mapped[str] = mapped_column(
        ForeignKey("dashboards.id", ondelete="CASCADE"),
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
    title: Mapped[str | None] = mapped_column(
        String(100),
        nullable=True,
    )
    description: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    # Widget Visualization Configurations
    widget_type: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
    )
    data_source: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
        default="telemetry",
    )
    query_config: Mapped[dict] = mapped_column(
        JSON,
        nullable=False,
    )
    display_config: Mapped[dict | None] = mapped_column(
        JSON,
        nullable=True,
    )
    refresh_interval: Mapped[int | None] = mapped_column(
        Integer,
        nullable=True,
    )

    # Positioning & Grid Layout (Grafana-style)
    position_x: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        default=0,
    )
    position_y: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        default=0,
    )
    width: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        default=4,
    )
    height: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        default=3,
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

    # Composite Unique Constraints
    __table_args__ = (
        UniqueConstraint("dashboard_id", "code", name="uq_widget_dashboard_code"),
    )

    # Relationships
    dashboard: Mapped[Dashboard] = relationship(
        "Dashboard",
        back_populates="widgets",
    )
