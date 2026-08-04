from datetime import datetime
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field

class CommandCreate(BaseModel):
    command_type: str = Field(..., max_length=50, description="Type of command to execute")
    payload: Optional[Dict[str, Any] | List[Any]] = Field(None, description="Payload for the command")

class CommandRead(BaseModel):
    id: str
    device_id: str
    command_type: str
    payload: Optional[Dict[str, Any] | List[Any]] = None
    status: str
    sent_time: Optional[datetime] = None
    response_time: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class CommandUpdate(BaseModel):
    status: Optional[str] = None
    response_time: Optional[datetime] = None
