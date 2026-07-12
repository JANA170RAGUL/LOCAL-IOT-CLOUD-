"""
app/modules/rules/schemas/rule.py

Pydantic validation schemas for the Rule module.
"""

from __future__ import annotations

from datetime import datetime
from typing import Optional, Any
from pydantic import BaseModel, Field


class RuleBase(BaseModel):
    code: str = Field(..., min_length=2, max_length=50, pattern=r"^[a-zA-Z0-9_\-]+$")
    name: str = Field(..., min_length=2, max_length=100)
    description: Optional[str] = None
    sensor_id: str
    condition: str = Field(..., description="Evaluation operator, e.g., >, <, ==, etc.")
    threshold: float
    severity: str = Field("INFO", pattern=r"^(INFO|WARNING|CRITICAL|EMERGENCY)$")
    enabled: bool = True
    cooldown_seconds: int = Field(60, ge=0)
    action_type: str = Field(..., description="Action category, e.g., EMAIL, MQTT, SMS, WEBHOOK, etc.")
    action_config: dict[str, Any] = Field(..., description="Parameters required for executing the action")


class RuleCreate(RuleBase):
    pass


class RuleUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=2, max_length=100)
    description: Optional[str] = None
    sensor_id: Optional[str] = None
    condition: Optional[str] = None
    threshold: Optional[float] = None
    severity: Optional[str] = Field(None, pattern=r"^(INFO|WARNING|CRITICAL|EMERGENCY)$")
    enabled: Optional[bool] = None
    cooldown_seconds: Optional[int] = Field(None, ge=0)
    action_type: Optional[str] = None
    action_config: Optional[dict[str, Any]] = None
    status: Optional[str] = Field(None, max_length=20)


class RuleResponse(RuleBase):
    id: str
    project_id: str
    status: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class RuleFilter(BaseModel):
    status: Optional[str] = None
    enabled: Optional[bool] = None
    search: Optional[str] = None


class RuleListResponse(BaseModel):
    total: int
    page: int
    page_size: int
    items: list[RuleResponse]
