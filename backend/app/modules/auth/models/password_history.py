from sqlalchemy import Column, String, ForeignKey
from app.database.base import BaseModel

class PasswordHistory(BaseModel):
    __tablename__ = "password_history"

    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
