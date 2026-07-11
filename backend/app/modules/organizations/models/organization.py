from datetime import datetime

from sqlalchemy import String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.database.base import BaseModel


class Organization(BaseModel):
    __tablename__ = "organizations"

    # ── Identity ────────────────────────────────────────────────────────────
    code: Mapped[str] = mapped_column(
        String(20),
        unique=True,
        nullable=False,
        index=True,
    )

    name: Mapped[str] = mapped_column(
        String(150),
        nullable=False,
        index=True,
    )

    description: Mapped[str | None] = mapped_column(
        String(500),
        nullable=True,
    )

    logo_url: Mapped[str | None] = mapped_column(
        String(500),
        nullable=True,
    )

    # ── Contact ──────────────────────────────────────────────────────────────
    email: Mapped[str] = mapped_column(
        String(150),
        unique=True,
        nullable=False,
    )

    phone: Mapped[str | None] = mapped_column(
        String(20),
        nullable=True,
    )

    website: Mapped[str | None] = mapped_column(
        String(255),
        nullable=True,
    )

    # ── Location ─────────────────────────────────────────────────────────────
    address: Mapped[str | None] = mapped_column(
        Text,           # Unlimited length — handles long international addresses
        nullable=True,
    )

    city: Mapped[str | None] = mapped_column(
        String(100),
        nullable=True,
    )

    state: Mapped[str | None] = mapped_column(
        String(100),
        nullable=True,
    )

    country: Mapped[str | None] = mapped_column(
        String(100),
        nullable=True,
    )

    # ── Locale ───────────────────────────────────────────────────────────────
    timezone: Mapped[str] = mapped_column(
        String(100),
        default="Asia/Kolkata",
    )

    language: Mapped[str] = mapped_column(
        String(50),
        default="en",
    )

    currency: Mapped[str] = mapped_column(
        String(10),
        default="INR",
    )

    # ── Status & Licensing ───────────────────────────────────────────────────
    # Replaces the old Mapped[bool] status field.
    # Valid values: ACTIVE | INACTIVE | SUSPENDED | TRIAL | EXPIRED
    # is_active (from BaseModel) remains the soft-delete / enabled flag.
    status: Mapped[str] = mapped_column(
        String(20),
        default="ACTIVE",
        nullable=False,
    )

    # Community | Professional | Enterprise | Academic
    license_type: Mapped[str] = mapped_column(
        String(50),
        default="Community",
        nullable=False,
    )

    # None means the license does not expire (e.g. Community tier)
    subscription_end: Mapped[datetime | None] = mapped_column(
        nullable=True,
    )