"""
app/modules/widgets/schemas/widget.py

Pydantic validation schemas for the Widget module.
"""

from __future__ import annotations

from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field

from app.shared.widgets.widget_types import WidgetType


class WidgetBase(BaseModel):
    code: str = Field(..., min_length=2, max_length=50, pattern=r"^[a-zA-Z0-9_\-]+$")
    name: str = Field(..., min_length=2, max_length=100)
    title: Optional[str] = Field(None, max_length=100)
    description: Optional[str] = None
    widget_type: WidgetType
    data_source: str = Field("telemetry", max_length=50)
    query_config: dict = Field(..., description="Query configuration parameters (sensors, aggregates, intervals)")
    display_config: Optional[dict] = Field(None, description="Visual settings parameters (colors, legends, min, max)")
    refresh_interval: Optional[int] = Field(None, ge=0)
    position_x: int = Field(0, ge=0)
    position_y: int = Field(0, ge=0)
    width: int = Field(4, ge=1)
    height: int = Field(3, ge=1)


class WidgetCreate(WidgetBase):
    pass


class WidgetUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=2, max_length=100)
    title: Optional[str] = Field(None, max_length=100)
    description: Optional[str] = None
    widget_type: Optional[WidgetType] = None
    data_source: Optional[str] = Field(None, max_length=50)
    query_config: Optional[dict] = None
    display_config: Optional[dict] = None
    refresh_interval: Optional[int] = Field(None, ge=0)
    position_x: Optional[int] = Field(None, ge=0)
    position_y: Optional[int] = Field(None, ge=0)
    width: Optional[int] = Field(None, ge=1)
    height: Optional[int] = Field(None, ge=1)
    status: Optional[str] = Field(None, max_length=20)


class WidgetResponse(WidgetBase):
    id: str
    dashboard_id: str
    status: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class WidgetListResponse(BaseModel):
    total: int
    items: list[WidgetResponse]
