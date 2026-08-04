from pydantic import BaseModel
from typing import Any, Dict, Optional
from datetime import datetime

class SettingBase(BaseModel):
    category: str
    key: str
    value: Dict[str, Any]
    description: Optional[str] = None

class SettingCreate(SettingBase):
    pass

class SettingUpdate(BaseModel):
    value: Dict[str, Any]
    description: Optional[str] = None

class SettingResponse(SettingBase):
    id: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class CategoryUpdateRequest(BaseModel):
    settings: Dict[str, Any]
