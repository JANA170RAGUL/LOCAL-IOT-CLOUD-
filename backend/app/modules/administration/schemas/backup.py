from pydantic import BaseModel
from datetime import datetime

class BackupFile(BaseModel):
    filename: str
    size_mb: float
    created_at: datetime

class BackupCreateResponse(BaseModel):
    message: str
    filename: str

class RestoreRequest(BaseModel):
    filename: str
