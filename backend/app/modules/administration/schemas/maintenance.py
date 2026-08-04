from pydantic import BaseModel
from typing import Optional

class MaintenanceActionResponse(BaseModel):
    message: str
    status: str

class CleanLogsRequest(BaseModel):
    days_to_keep: int = 30
    log_type: Optional[str] = "all" # "audit", "activity", "all"
