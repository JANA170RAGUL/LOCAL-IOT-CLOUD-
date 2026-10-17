from datetime import datetime

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, String
from sqlalchemy.dialects.mysql import CHAR
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import BaseModel


class DeviceConnection(BaseModel):
    __tablename__ = "device_connections"

    device_id: Mapped[str] = mapped_column(
        CHAR(36),
        ForeignKey("devices.id", ondelete="CASCADE"),
        nullable=False,
        unique=True,
        index=True,
    )

    connection_type: Mapped[str] = mapped_column(
        String(30),
        nullable=False,
        default="SSH",
    )

    host: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
    )

    port: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        default=22,
    )

    username: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
    )

    authentication_type: Mapped[str] = mapped_column(
        String(30),
        nullable=False,
        default="PASSWORD",
    )

    credential_ref: Mapped[str | None] = mapped_column(
        String(255),
        nullable=True,
    )

    host_key_verified: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=False,
    )

    last_tested_at: Mapped[datetime | None] = mapped_column(
        DateTime,
        nullable=True,
    )

    last_test_status: Mapped[str | None] = mapped_column(
        String(30),
        nullable=True,
    )

    last_test_message: Mapped[str | None] = mapped_column(
        String(1000),
        nullable=True,
    )

    device = relationship(
        "Device",
        back_populates="connection",
    )