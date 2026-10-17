from datetime import datetime
from typing import TYPE_CHECKING
import enum

from sqlalchemy import JSON, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import BaseModel
from app.modules.commands.models.command_status import CommandStatus

if TYPE_CHECKING:
    from app.modules.devices.models.device import Device

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
        default=CommandStatus.QUEUED.value,
        nullable=False,
        index=True,
    )

    attempt_count: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        default=0,
    )

    max_attempts: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        default=3,
    )

    published_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )

    acknowledged_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )

    completed_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )

    expires_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )

    next_retry_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )

    last_error: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    response_message: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    sent_time: Mapped[datetime | None] = mapped_column(
        DateTime,
        nullable=True,
    )

    response_time: Mapped[datetime | None] = mapped_column(
        DateTime,
        nullable=True,
    )

    @property
    def command(self) -> str:
        return self.command_type

    @command.setter
    def command(self, value: str) -> None:
        self.command_type = value

    device: Mapped["Device"] = relationship(
        "Device",
    )
