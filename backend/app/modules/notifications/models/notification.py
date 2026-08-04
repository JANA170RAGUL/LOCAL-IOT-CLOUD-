from sqlalchemy import ForeignKey, String, Text, Boolean, DateTime, Integer
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database.base import BaseModel
from datetime import datetime
from typing import Optional

class NotificationTemplate(BaseModel):
    __tablename__ = "notification_templates"

    name: Mapped[str] = mapped_column(String(100), unique=True, index=True)
    channel: Mapped[str] = mapped_column(String(20), default="EMAIL") # EMAIL, SMS
    subject_template: Mapped[str] = mapped_column(String(255))
    body_template: Mapped[str] = mapped_column(Text)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)


class Notification(BaseModel):
    __tablename__ = "notifications"

    user_id: Mapped[Optional[str]] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=True, index=True)
    recipient: Mapped[str] = mapped_column(String(255), index=True) # email address or phone number
    channel: Mapped[str] = mapped_column(String(20), default="EMAIL")
    subject: Mapped[str] = mapped_column(String(255))
    body: Mapped[str] = mapped_column(Text)
    
    # Status can be PENDING, SENT, FAILED
    status: Mapped[str] = mapped_column(String(20), default="PENDING", index=True)
    retry_count: Mapped[int] = mapped_column(Integer, default=0)
    error_message: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    
    sent_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)

    user = relationship("User", lazy="select")


class UserNotificationPreference(BaseModel):
    __tablename__ = "user_notification_preferences"

    user_id: Mapped[str] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    channel: Mapped[str] = mapped_column(String(20)) # EMAIL, SMS
    is_enabled: Mapped[bool] = mapped_column(Boolean, default=True)

    user = relationship("User", lazy="select")
