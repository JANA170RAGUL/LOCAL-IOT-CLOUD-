from sqlalchemy import Column, String, Boolean, DateTime, ForeignKey, Integer, func
from app.database.base import BaseModel

class User(BaseModel):
    __tablename__ = "users"

    organization_id = Column(String(36), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=True)
    tenant_id = Column(String(36), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=True)
    
    first_name = Column(String(100), nullable=False)
    last_name = Column(String(100), nullable=False)
    
    email = Column(String(255), unique=True, index=True, nullable=False)
    phone = Column(String(50), nullable=True)
    
    password_hash = Column(String(255), nullable=False)
    
    role = Column(String(50), nullable=False, default="Viewer")
    status = Column(String(50), nullable=False, default="ACTIVE")
    
    last_login = Column(DateTime(timezone=True), nullable=True)

    # Security fields
    is_verified = Column(Boolean, nullable=False, default=False)
    force_password_change = Column(Boolean, nullable=False, default=False)
    avatar_url = Column(String(500), nullable=True)
    password_changed_at = Column(DateTime(timezone=True), nullable=True)
    failed_login_attempts = Column(Integer, nullable=False, default=0)
    locked_until = Column(DateTime(timezone=True), nullable=True)
