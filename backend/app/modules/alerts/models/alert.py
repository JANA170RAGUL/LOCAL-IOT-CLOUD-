"""
app/modules/alerts/models/alert.py

Alert model representation in SQLAlchemy.
"""

from __future__ import annotations

from datetime import datetime
from typing import TYPE_CHECKING
from sqlalchemy import ForeignKey, String, Text, Boolean, DateTime, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import BaseModel

if TYPE_CHECKING:
    from app.modules.rules.models.rule import Rule
    from app.modules.sensors.models.sensor import Sensor
    from app.modules.devices.models.device import Device


class Alert(BaseModel):
    __tablename__ = "alerts"

    # Foreign Keys
    rule_id: Mapped[str | None] = mapped_column(
        ForeignKey("rules.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    sensor_id: Mapped[str | None] = mapped_column(
        ForeignKey("sensors.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    device_id: Mapped[str | None] = mapped_column(
        ForeignKey("devices.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )

    # Alert specifications
    severity: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
        default="INFO",
    )
    title: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
        index=True,
    )
    message: Mapped[str] = mapped_column(
        Text,
        nullable=False,
    )
    status: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
        default="OPEN",
        index=True,
    )

    # Workflow tracking
    acknowledged: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=False,
    )
    acknowledged_by: Mapped[str | None] = mapped_column(
        String(100),
        nullable=True,
    )
    acknowledged_at: Mapped[datetime | None] = mapped_column(
        DateTime,
        nullable=True,
    )

    resolved: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=False,
    )
    resolved_at: Mapped[datetime | None] = mapped_column(
        DateTime,
        nullable=True,
    )

    # Additional contextual data
    metadata_json: Mapped[dict | None] = mapped_column(
        JSON,
        name="metadata",
        nullable=True,
    )

    is_active: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=True,
        index=True,
    )

    # Relationships
    rule: Mapped[Rule | None] = relationship(
        "Rule",
        lazy="select",
    )
    sensor: Mapped[Sensor | None] = relationship(
        "Sensor",
        lazy="select",
    )
    device: Mapped[Device | None] = relationship(
        "Device",
        lazy="select",
    )
