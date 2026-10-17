"""
app/modules/devices/models/device_credential.py

DeviceCredential — stores hashed API keys for hardware authentication.
"""

from __future__ import annotations

from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import DateTime, ForeignKey, Index, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import BaseModel

if TYPE_CHECKING:
    from app.modules.devices.models.device import Device


class DeviceCredential(BaseModel):
    __tablename__ = "device_credentials"

    device_id: Mapped[str] = mapped_column(

        
        ForeignKey(
            "devices.id",
            ondelete="CASCADE",
        ),
        nullable=False,
        index=True,
    )

    # Public identifier.
    # Safe to expose because this is NOT the secret.
    key_id: Mapped[str] = mapped_column(
        String(32),
        nullable=False,
        unique=True,
        index=True,
    )

    name: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
        default="Primary",
    )

    # HMAC-SHA256 digest only.
    # Raw secret is NEVER stored.
    secret_hash: Mapped[str] = mapped_column(
        String(64),
        nullable=False,
    )

    expires_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )

    last_used_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )

    revoked_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )

    device: Mapped["Device"] = relationship(
        "Device",
        back_populates="credentials",
    )

    __table_args__ = (
        Index(
            "ix_device_credentials_device_active",
            "device_id",
            "is_active",
        ),
    )
