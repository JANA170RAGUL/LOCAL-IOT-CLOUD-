from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, List, Dict, Any
from datetime import datetime

class AuditLogResponse(BaseModel):
    id: str
    user_id: Optional[str]
    user_name: Optional[str]
    action: str
    module: Optional[str]
    resource_type: Optional[str]
    resource_id: Optional[str]
    status: Optional[str]
    details: Optional[Dict[str, Any]]
    ip_address: Optional[str]
    created_at: datetime
    
    model_config = ConfigDict(from_attributes=True)

class AuditLogListResponse(BaseModel):
    total: int
    page: int
    page_size: int
    total_pages: int
    items: List[AuditLogResponse]

class ActivityLogResponse(BaseModel):
    id: str
    action: str
    module: Optional[str]
    resource_type: Optional[str]
    resource_id: Optional[str]
    details: Optional[Dict[str, Any]]
    status: Optional[str]
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class ActivityLogListResponse(BaseModel):
    total: int
    page: int
    page_size: int
    total_pages: int
    items: List[ActivityLogResponse]
