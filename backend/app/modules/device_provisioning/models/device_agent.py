"""
app/modules/device_provisioning/models/device_agent.py

DeviceAgent model for edge agent tracking.
"""

from __future__ import annotations

from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import Boolean, DateTime, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import BaseModel

if TYPE_CHECKING:
    from app.modules.devices.models.device import Device


class DeviceAgent(BaseModel):
    __tablename__ = "device_agents"

    device_id: Mapped[str] = mapped_column(
        ForeignKey("devices.id", ondelete="CASCADE"),
        nullable=False,
        unique=True,
        index=True,
    )

    installed: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=False,
    )

    agent_name: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
        default="localiot-agent",
    )

    agent_version: Mapped[str | None] = mapped_column(
        String(50),
        nullable=True,
    )

    platform: Mapped[str | None] = mapped_column(
        String(100),
        nullable=True,
    )

    architecture: Mapped[str | None] = mapped_column(
        String(50),
        nullable=True,
    )

    service_status: Mapped[str | None] = mapped_column(
        String(30),
        nullable=True,
    )

    last_seen_at: Mapped[datetime | None] = mapped_column(
        DateTime,
        nullable=True,
    )

    device: Mapped["Device"] = relationship(
        "Device",
        lazy="select",
    )
