from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field
from datetime import datetime
from uuid import UUID

from app.modules.channels.models.channel import ChannelVisibility, ApiKeyType

class ChannelFieldBase(BaseModel):
    field_key: str
    name: str
    unit: Optional[str] = None
    data_type: str = "float"
    description: Optional[str] = None

class ChannelFieldCreate(ChannelFieldBase):
    pass

class ChannelFieldResponse(ChannelFieldBase):
    id: str
    channel_id: str

    class Config:
        from_attributes = True

class ChannelApiKeyResponse(BaseModel):
    id: str
    key_type: ApiKeyType
    api_key: str
    created_at: datetime

    class Config:
        from_attributes = True

class ChannelBase(BaseModel):
    name: str
    description: Optional[str] = None
    project_id: Optional[str] = None
    visibility: ChannelVisibility = ChannelVisibility.PRIVATE
    metadata_dict: Optional[Dict[str, Any]] = None

class ChannelCreate(ChannelBase):
    fields: Optional[List[ChannelFieldCreate]] = None

class ChannelUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    project_id: Optional[str] = None
    visibility: Optional[ChannelVisibility] = None
    metadata_dict: Optional[Dict[str, Any]] = None
    fields: Optional[List[ChannelFieldCreate]] = None

class ChannelResponse(ChannelBase):
    id: str
    owner_id: str
    created_at: datetime
    updated_at: datetime
    fields: List[ChannelFieldResponse] = []
    api_keys: List[ChannelApiKeyResponse] = []

    class Config:
        from_attributes = True
