"""
app/modules/rules/models/rule.py

Rule model representation in SQLAlchemy.
"""

from __future__ import annotations

from typing import TYPE_CHECKING
from sqlalchemy import ForeignKey, String, Text, UniqueConstraint, Boolean, Integer, JSON, Float
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import BaseModel

if TYPE_CHECKING:
    from app.modules.projects.models.project import Project
    from app.modules.sensors.models.sensor import Sensor


class Rule(BaseModel):
    __tablename__ = "rules"

    # Foreign Keys
    project_id: Mapped[str] = mapped_column(
        ForeignKey("projects.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )
    sensor_id: Mapped[str] = mapped_column(
        ForeignKey("sensors.id", ondelete="RESTRICT"),
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

    # Condition & Configuration
    # >, <, >=, <=, ==, !=, BETWEEN, IN, NOT_IN, CHANGED, INCREASED, DECREASED
    condition: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
    )
    threshold: Mapped[float] = mapped_column(
        Float,
        nullable=False,
    )
    severity: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
        default="INFO",
    )
    enabled: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=True,
    )
    cooldown_seconds: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        default=60,
    )

    # Action Configuration
    # EMAIL, SMS, WEBHOOK, MQTT, DEVICE_COMMAND, CREATE_ALERT, CUSTOM
    action_type: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
    )
    action_config: Mapped[dict] = mapped_column(
        JSON,
        nullable=False,
    )

    # Status
    status: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
        default="ACTIVE",
        index=True,
    )

    # Composite Unique Constraints
    __table_args__ = (
        UniqueConstraint("project_id", "code", name="uq_rule_project_code"),
    )

    # Relationships
    project: Mapped[Project] = relationship(
        "Project",
        back_populates="rules",
    )
    sensor: Mapped[Sensor] = relationship(
        "Sensor",
        back_populates="rules",
    )
