"""
app/modules/dashboards/schemas/dashboard.py

Pydantic validation schemas for the Dashboard module.
"""

from __future__ import annotations

from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field


class DashboardBase(BaseModel):
    code: str = Field(..., min_length=2, max_length=50, pattern=r"^[a-zA-Z0-9_\-]+$")
    name: str = Field(..., min_length=2, max_length=100)
    description: Optional[str] = None
    layout: Optional[dict | list] = None
    theme: Optional[str] = Field(None, max_length=50)
    is_public: bool = False
    refresh_interval: Optional[int] = Field(None, ge=0)


class DashboardCreate(DashboardBase):
    pass


class DashboardUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=2, max_length=100)
    description: Optional[str] = None
    layout: Optional[dict | list] = None
    theme: Optional[str] = Field(None, max_length=50)
    is_public: Optional[bool] = None
    refresh_interval: Optional[int] = Field(None, ge=0)
    status: Optional[str] = Field(None, max_length=20)


class DashboardResponse(DashboardBase):
    id: str
    project_id: str
    status: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class DashboardFilter(BaseModel):
    status: Optional[str] = None
    search: Optional[str] = None


class DashboardListResponse(BaseModel):
    total: int
    page: int
    page_size: int
    items: list[DashboardResponse]
