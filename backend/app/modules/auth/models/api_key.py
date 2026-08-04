from sqlalchemy import Column, String, DateTime, ForeignKey, JSON
from app.database.base import BaseModel

class ApiKey(BaseModel):
    __tablename__ = "api_keys"

    organization_id = Column(String(36), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False, index=True)
    tenant_id = Column(String(36), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=True, index=True)
    name = Column(String(100), nullable=False)
    key_hash = Column(String(255), nullable=False)
    prefix = Column(String(20), nullable=False)
    scopes = Column(JSON, nullable=True)
    expires_at = Column(DateTime(timezone=True), nullable=True)
    last_used_at = Column(DateTime(timezone=True), nullable=True)
