"""
app/modules/devices/models/device.py

Device — individual IoT devices connected via edge gateways.
Every device belongs to a Gateway.
"""

from __future__ import annotations

from datetime import datetime
from sqlalchemy import DateTime, ForeignKey, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from typing import TYPE_CHECKING

from app.database.base import BaseModel

if TYPE_CHECKING:
    from app.modules.sensors.models.sensor import Sensor


class Device(BaseModel):
    __tablename__ = "devices"

    # ── Composite Unique Constraint ──────────────────────────────────────────
    # code is unique within a gateway, not globally.
    __table_args__ = (
        UniqueConstraint(
            "gateway_id",
            "code",
            name="uq_device_gateway_code",
        ),
    )

    # ── Parent ───────────────────────────────────────────────────────────────
    # UUID FK → gateways.id
    gateway_id: Mapped[str] = mapped_column(
        ForeignKey("gateways.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )

    # ── Identity ─────────────────────────────────────────────────────────────
    # code is NOT globally unique — uniqueness is scoped to gateway_id
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

    # ── Device Specifications ────────────────────────────────────────────────
    device_type: Mapped[str | None] = mapped_column(
        String(50),
        nullable=True,
    )

    manufacturer: Mapped[str | None] = mapped_column(
        String(100),
        nullable=True,
    )

    model: Mapped[str | None] = mapped_column(
        String(100),
        nullable=True,
    )

    serial_number: Mapped[str | None] = mapped_column(
        String(100),
        nullable=True,
    )

    firmware_version: Mapped[str | None] = mapped_column(
        String(50),
        nullable=True,
    )

    hardware_version: Mapped[str | None] = mapped_column(
        String(50),
        nullable=True,
    )

    mac_address: Mapped[str | None] = mapped_column(
        String(17),
        nullable=True,
    )

    ip_address: Mapped[str | None] = mapped_column(
        String(45),
        nullable=True,
    )

    # ── Status & Heartbeat ───────────────────────────────────────────────────
    status: Mapped[str] = mapped_column(
        String(20),
        default="ACTIVE",
        nullable=False,
        index=True,
    )

    last_seen: Mapped[datetime | None] = mapped_column(
        DateTime,
        nullable=True,
    )

    # ── Relationships ─────────────────────────────────────────────────────────
    gateway: Mapped["Gateway"] = relationship(  # type: ignore[name-defined]
        "Gateway",
        back_populates="devices",
    )

    sensors: Mapped[list[Sensor]] = relationship(
        "Sensor",
        back_populates="device",
        cascade="all, delete-orphan",
        lazy="select",
    )

