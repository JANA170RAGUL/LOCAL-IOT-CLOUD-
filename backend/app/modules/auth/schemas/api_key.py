from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime

class ApiKeyCreate(BaseModel):
    name: str = Field(..., max_length=100)
    scopes: Optional[List[str]] = None
    expires_in_days: Optional[int] = None

class ApiKeyResponse(BaseModel):
    id: str
    name: str
    prefix: str
    scopes: Optional[List[str]] = None
    expires_at: Optional[datetime] = None
    last_used_at: Optional[datetime] = None
    is_active: bool
    created_at: datetime
    
    class Config:
        from_attributes = True

class ApiKeyCreateResponse(ApiKeyResponse):
    key: str # The raw cleartext key, ONLY returned once
