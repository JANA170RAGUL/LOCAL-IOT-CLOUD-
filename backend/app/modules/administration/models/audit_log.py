from sqlalchemy import Column, String, JSON, Text, ForeignKey
from app.database.base import BaseModel

class AuditLog(BaseModel):
    __tablename__ = "audit_logs"

    user_id = Column(String(36), ForeignKey("users.id"), nullable=True, index=True)
    user_name = Column(String(100), nullable=True)
    
    # What did they do? e.g. "User Login", "Organization Created"
    action = Column(String(100), nullable=False, index=True)
    
    # What module does this apply to? e.g. "Auth", "Organizations"
    module = Column(String(50), nullable=True, index=True)
    
    # What resource was modified?
    resource_type = Column(String(50), nullable=True, index=True)
    resource_id = Column(String(36), nullable=True, index=True)
    
    # Outcome e.g. "Success", "Failed"
    status = Column(String(50), nullable=True, default="Success")
    
    # Detailed changes or metadata
    details = Column(JSON, nullable=True)
    
    # Context
    ip_address = Column(String(50), nullable=True)
