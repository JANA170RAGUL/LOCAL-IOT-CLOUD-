from datetime import datetime
from typing import TYPE_CHECKING
import enum

from sqlalchemy import JSON, DateTime, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import BaseModel

if TYPE_CHECKING:
    from app.modules.devices.models.device import Device

class CommandStatus(str, enum.Enum):
    QUEUED = "Queued"
    SENT = "Sent"
    EXECUTED = "Executed"
    FAILED = "Failed"

class DeviceCommand(BaseModel):
    __tablename__ = "device_commands"

    device_id: Mapped[str] = mapped_column(
        ForeignKey("devices.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    command_type: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
    )

    payload: Mapped[dict | list | None] = mapped_column(
        JSON,
        nullable=True,
    )

    status: Mapped[str] = mapped_column(
        String(20),
        default=CommandStatus.QUEUED,
        nullable=False,
        index=True,
    )

    sent_time: Mapped[datetime | None] = mapped_column(
        DateTime,
        nullable=True,
    )

    response_time: Mapped[datetime | None] = mapped_column(
        DateTime,
        nullable=True,
    )

    device: Mapped["Device"] = relationship(
        "Device",
        # We don't add back_populates to keep Device model clean, 
        # unless we want to access device.commands
    )
