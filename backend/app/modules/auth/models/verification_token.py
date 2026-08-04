from sqlalchemy import Column, String, Boolean, DateTime, ForeignKey
from app.database.base import BaseModel

class VerificationToken(BaseModel):
    __tablename__ = "verification_tokens"

    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    token = Column(String(255), nullable=False, unique=True, index=True)
    purpose = Column(String(50), nullable=False) # EMAIL_VERIFICATION, PASSWORD_RESET, ORG_INVITE
    expires_at = Column(DateTime(timezone=True), nullable=False)
    is_used = Column(Boolean, nullable=False, default=False)
