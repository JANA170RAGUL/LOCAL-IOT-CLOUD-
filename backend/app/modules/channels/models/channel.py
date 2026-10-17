import uuid
from datetime import datetime
from sqlalchemy import Column, String, Text, DateTime, JSON, ForeignKey, Enum, Boolean, Integer
from sqlalchemy.orm import relationship
import enum

from app.database.base import BaseModel

class ChannelVisibility(str, enum.Enum):
    PUBLIC = "public"
    PRIVATE = "private"
    ENTERPRISE = "enterprise"

class ApiKeyType(str, enum.Enum):
    READ = "read"
    WRITE = "write"

class Channel(BaseModel):
    __tablename__ = "channels"

    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    project_id = Column(String(36), ForeignKey("projects.id"), nullable=True)
    visibility = Column(Enum(ChannelVisibility), default=ChannelVisibility.PRIVATE, nullable=False)
    owner_id = Column(String(36), ForeignKey("users.id"), nullable=False)
    metadata_dict = Column(JSON, nullable=True)

    # Relationships
    project = relationship("Project", backref="channels")
    owner = relationship("User", backref="owned_channels")
    fields = relationship("ChannelField", back_populates="channel", cascade="all, delete-orphan")
    api_keys = relationship("ChannelApiKey", back_populates="channel", cascade="all, delete-orphan")

class ChannelField(BaseModel):
    __tablename__ = "channel_fields"

    channel_id = Column(String(36), ForeignKey("channels.id", ondelete="CASCADE"), nullable=False)
    field_key = Column(String(50), nullable=False) # e.g., 'field1', 'field2'
    name = Column(String(255), nullable=False)
    unit = Column(String(50), nullable=True)
    data_type = Column(String(50), default="float", nullable=False)
    description = Column(Text, nullable=True)

    # Relationship
    channel = relationship("Channel", back_populates="fields")

class ChannelApiKey(BaseModel):
    __tablename__ = "channel_api_keys"

    channel_id = Column(String(36), ForeignKey("channels.id", ondelete="CASCADE"), nullable=False, index=True)
    key_id = Column(String(32), unique=True, index=True, nullable=False)
    key_hash = Column(String(64), nullable=False)
    key_type = Column(Enum(ApiKeyType), nullable=False)
    name = Column(String(100), nullable=False, default="Primary")
    expires_at = Column(DateTime(timezone=True), nullable=True)
    last_used_at = Column(DateTime(timezone=True), nullable=True)
    revoked_at = Column(DateTime(timezone=True), nullable=True)
    api_key = Column(String(255), nullable=True)

    # Relationship
    channel = relationship("Channel", back_populates="api_keys")

class WebhookType(str, enum.Enum):
    HTTP = "http"
    SLACK = "slack"
    DISCORD = "discord"
    TEAMS = "teams"
    EMAIL = "email"

class ChannelWebhook(BaseModel):
    __tablename__ = "channel_webhooks"

    channel_id = Column(String(36), ForeignKey("channels.id", ondelete="CASCADE"), nullable=False)
    name = Column(String(255), nullable=False)
    target_url = Column(Text, nullable=False)
    webhook_type = Column(Enum(WebhookType), default=WebhookType.HTTP, nullable=False)
    secret_encrypted = Column(String(512), nullable=True)
    auth_header = Column(String(255), nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    max_retries = Column(Integer, default=3, nullable=False)
    timeout_seconds = Column(Integer, default=5, nullable=False)
    trigger_events = Column(JSON, nullable=False) # list of strings

    # Relationships
    channel = relationship("Channel", backref="webhooks")
    logs = relationship("WebhookDeliveryLog", back_populates="webhook", cascade="all, delete-orphan")

class WebhookDeliveryLog(BaseModel):
    __tablename__ = "webhook_delivery_logs"

    webhook_id = Column(String(36), ForeignKey("channel_webhooks.id", ondelete="CASCADE"), nullable=False)
    event_type = Column(String(100), nullable=False)
    http_status = Column(Integer, nullable=True)
    response_time_ms = Column(Integer, nullable=True)
    success = Column(Boolean, default=False, nullable=False)
    response_body = Column(Text, nullable=True)
    retry_count = Column(Integer, default=0, nullable=False)

    # Relationships
    webhook = relationship("ChannelWebhook", back_populates="logs")
