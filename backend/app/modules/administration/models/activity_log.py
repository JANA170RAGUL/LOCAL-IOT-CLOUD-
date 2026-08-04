from sqlalchemy import Column, String, JSON, Text
from app.database.base import BaseModel

class ActivityLog(BaseModel):
    __tablename__ = "activity_logs"

    # What happened? e.g. "Device Connected", "Rule Triggered"
    action = Column(String(100), nullable=False, index=True)
    
    # What module does this apply to? e.g. "MQTT", "Rules", "Telemetry"
    module = Column(String(50), nullable=True, index=True)
    
    # What resource triggered this?
    resource_type = Column(String(50), nullable=True, index=True)
    resource_id = Column(String(36), nullable=True, index=True)
    
    # Detailed changes or metadata
    details = Column(JSON, nullable=True)
    
    # Status e.g. "Info", "Warning", "Error"
    status = Column(String(50), nullable=True, default="Info")
