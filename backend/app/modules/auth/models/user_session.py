from sqlalchemy import Column, String, Boolean, DateTime, ForeignKey
from app.database.base import BaseModel

class UserSession(BaseModel):
    __tablename__ = "user_sessions"

    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    refresh_token = Column(String(500), nullable=False, unique=True, index=True)
    device_info = Column(String(255), nullable=True)
    ip_address = Column(String(50), nullable=True)
    expires_at = Column(DateTime(timezone=True), nullable=False)
    # is_active is inherited from BaseModel, but let's make sure it's used for session invalidation
