"""
app/modules/sensors/models/sensor.py

Sensor — measurable signal/stream exposed by a Device.
Every sensor belongs to a Device.
"""

from __future__ import annotations

from datetime import datetime

from sqlalchemy import DateTime, Float, ForeignKey, Integer, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import BaseModel

from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from app.modules.devices.models.device import Device
    from app.modules.rules.models.rule import Rule


class Sensor(BaseModel):
    __tablename__ = "sensors"

    # ── Composite Unique Constraint ──────────────────────────────────────────
    # code is unique within a device, not globally.
    __table_args__ = (
        UniqueConstraint(
            "device_id",
            "code",
            name="uq_sensor_device_code",
        ),
    )

    # ── Parent ───────────────────────────────────────────────────────────────
    # UUID FK → devices.id
    device_id: Mapped[str] = mapped_column(
        ForeignKey("devices.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )

    # ── Identity ─────────────────────────────────────────────────────────────
    # code is NOT globally unique — uniqueness is scoped to device_id
    code: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
    )

    name: Mapped[str] = mapped_column(
        String(150),
        nullable=False,
        index=True,
    )

    # ── Sensor Classification ────────────────────────────────────────────────
    # TEMPERATURE, HUMIDITY, PH, NPK, CUSTOM, etc.
    sensor_type: Mapped[str] = mapped_column(
        String(50),
        default="CUSTOM",
        nullable=False,
    )

    unit: Mapped[str | None] = mapped_column(
        String(20),
        nullable=True,
    )

    # NUMBER, BOOLEAN, STRING, JSON, GEO
    data_type: Mapped[str] = mapped_column(
        String(20),
        default="number",
        nullable=False,
    )

    # ── Operational Boundaries ───────────────────────────────────────────────
    min_value: Mapped[float | None] = mapped_column(
        Float,
        nullable=True,
    )

    max_value: Mapped[float | None] = mapped_column(
        Float,
        nullable=True,
    )

    default_value: Mapped[str | None] = mapped_column(
        String(255),
        nullable=True,
    )

    # In seconds (e.g. 5 means telemetry read every 5 seconds)
    sampling_interval: Mapped[int | None] = mapped_column(
        Integer,
        default=5,
        nullable=True,
    )

    # ── Calibration Factors ──────────────────────────────────────────────────
    # Telemetry value is calculated as: (RawValue * Scale) + Offset
    calibration_offset: Mapped[float] = mapped_column(
        Float,
        default=0.0,
        nullable=False,
    )

    calibration_scale: Mapped[float] = mapped_column(
        Float,
        default=1.0,
        nullable=False,
    )

    # ── Status & Dynamic Readings ────────────────────────────────────────────
    status: Mapped[str] = mapped_column(
        String(20),
        default="ACTIVE",
        nullable=False,
        index=True,
    )

    last_reading_at: Mapped[datetime | None] = mapped_column(
        DateTime,
        nullable=True,
    )

    # ── Relationships ─────────────────────────────────────────────────────────
    device: Mapped["Device"] = relationship(  # type: ignore[name-defined]
        "Device",
        back_populates="sensors",
    )

    rules: Mapped[list[Rule]] = relationship(
        "Rule",
        back_populates="sensor",
        cascade="all, delete-orphan",
        lazy="select",
    )
