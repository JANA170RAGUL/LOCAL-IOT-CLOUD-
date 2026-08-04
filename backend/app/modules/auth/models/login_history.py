from sqlalchemy import Column, String, ForeignKey
from app.database.base import BaseModel

class LoginHistory(BaseModel):
    __tablename__ = "login_history"

    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    status = Column(String(50), nullable=False) # SUCCESS / FAILED
    ip_address = Column(String(50), nullable=True)
    device_info = Column(String(255), nullable=True)
