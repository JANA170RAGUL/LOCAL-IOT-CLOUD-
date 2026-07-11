"""
app/modules/gateways/models/gateway.py

Gateway — edge gateway that bridges physical IoT devices to the LocalIoTCloud platform.
Every gateway belongs to a Project.
"""

from __future__ import annotations

from datetime import datetime
from sqlalchemy import DateTime, ForeignKey, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import BaseModel


class Gateway(BaseModel):
    __tablename__ = "gateways"

    # ── Composite Unique Constraint ──────────────────────────────────────────
    # code is unique within a project, not globally.
    __table_args__ = (
        UniqueConstraint(
            "project_id",
            "code",
            name="uq_gateway_project_code",
        ),
    )

    # ── Parent ───────────────────────────────────────────────────────────────
    # UUID FK → projects.id
    project_id: Mapped[str] = mapped_column(
        ForeignKey("projects.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )

    # ── Identity ─────────────────────────────────────────────────────────────
    # code is NOT globally unique — uniqueness is scoped to project_id
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

    # ── Edge Details ─────────────────────────────────────────────────────────
    location: Mapped[str | None] = mapped_column(
        String(255),
        nullable=True,
    )

    ip_address: Mapped[str | None] = mapped_column(
        String(45),
        nullable=True,
    )

    mac_address: Mapped[str | None] = mapped_column(
        String(17),
        nullable=True,
    )

    firmware_version: Mapped[str | None] = mapped_column(
        String(50),
        nullable=True,
    )

    # ── Lifecycle & Status ───────────────────────────────────────────────────
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

    # ── Connectivity ─────────────────────────────────────────────────────────
    # MQTT, HTTP, COAP, WEBSOCKET, MODBUS, OPC_UA
    protocol: Mapped[str] = mapped_column(
        String(20),
        default="MQTT",
        nullable=False,
    )

    mqtt_topic: Mapped[str | None] = mapped_column(
        String(255),
        nullable=True,
    )

    # ── Relationships ─────────────────────────────────────────────────────────
    project: Mapped["Project"] = relationship(  # type: ignore[name-defined]
        "Project",
        back_populates="gateways",
    )
