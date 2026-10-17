"""
app/modules/alerts/schemas/alert.py

Pydantic validation schemas for the Alert module.
"""

from __future__ import annotations

from datetime import datetime
from typing import Optional, Any
from pydantic import AliasChoices, BaseModel, Field


class AlertBase(BaseModel):
    rule_id: Optional[str] = None
    sensor_id: Optional[str] = None
    device_id: Optional[str] = None
    severity: str = Field("INFO", pattern=r"^(INFO|WARNING|CRITICAL|EMERGENCY)$")
    title: str = Field(..., min_length=2, max_length=255)
    message: str
    status: str = Field("OPEN", pattern=r"^(OPEN|ACKNOWLEDGED|RESOLVED|CLOSED)$")
    acknowledged: bool = False
    acknowledged_by: Optional[str] = Field(None, max_length=100)
    acknowledged_at: Optional[datetime] = None
    resolved: bool = False
    resolved_at: Optional[datetime] = None
    metadata_json: Optional[dict[str, Any]] = Field(None, validation_alias=AliasChoices("metadata_json", "metadata"), serialization_alias="metadata")


class AlertCreate(AlertBase):
    pass


class AlertUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=2, max_length=255)
    message: Optional[str] = None
    status: Optional[str] = Field(None, pattern=r"^(OPEN|ACKNOWLEDGED|RESOLVED|CLOSED)$")
    acknowledged: Optional[bool] = None
    acknowledged_by: Optional[str] = Field(None, max_length=100)
    acknowledged_at: Optional[datetime] = None
    resolved: Optional[bool] = None
    resolved_at: Optional[datetime] = None
    metadata_json: Optional[dict[str, Any]] = Field(None, serialization_alias="metadata")
    status_is_active: Optional[bool] = Field(None, alias="is_active")


class AlertAcknowledgeRequest(BaseModel):
    acknowledged_by: str = Field(..., min_length=1, max_length=100)


class AlertResponse(AlertBase):
    id: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
        populate_by_name = True


class AlertFilter(BaseModel):
    status: Optional[str] = None
    severity: Optional[str] = None
    acknowledged: Optional[bool] = None
    resolved: Optional[bool] = None
    search: Optional[str] = None


class AlertListResponse(BaseModel):
    total: int
    page: int
    page_size: int
    items: list[AlertResponse]
