from datetime import datetime
from enum import Enum
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


class CommandCreate(BaseModel):
    command_type: str = Field(..., max_length=50, description="Type of command to execute")
    payload: Optional[Dict[str, Any] | List[Any]] = Field(None, description="Payload for the command")
    expires_in_seconds: Optional[int] = Field(None, description="Optional custom expiration in seconds")


class CommandRead(BaseModel):
    id: str
    device_id: str
    command_type: str
    command: Optional[str] = None
    payload: Optional[Dict[str, Any] | List[Any]] = None
    status: str
    attempt_count: int = 0
    max_attempts: int = 3
    published_at: Optional[datetime] = None
    acknowledged_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    expires_at: Optional[datetime] = None
    next_retry_at: Optional[datetime] = None
    last_error: Optional[str] = None
    response_message: Optional[str] = None
    sent_time: Optional[datetime] = None
    response_time: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class CommandUpdate(BaseModel):
    status: Optional[str] = None
    attempt_count: Optional[int] = None
    published_at: Optional[datetime] = None
    acknowledged_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    next_retry_at: Optional[datetime] = None
    last_error: Optional[str] = None
    response_message: Optional[str] = None
    sent_time: Optional[datetime] = None
    response_time: Optional[datetime] = None


class DeviceCommandResponseStatus(str, Enum):
    ACKNOWLEDGED = "ACKNOWLEDGED"
    EXECUTED = "EXECUTED"
    FAILED = "FAILED"


class DeviceCommandResponse(BaseModel):
    command_id: str
    status: DeviceCommandResponseStatus
    message: Optional[str] = Field(default=None, max_length=1000)
