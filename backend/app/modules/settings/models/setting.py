from sqlalchemy import Column, String, JSON, Text, ForeignKey
from app.database.base import Base, BaseModel

class Setting(BaseModel):
    __tablename__ = "settings"

    category = Column(String(50), nullable=False, index=True)
    key = Column(String(100), nullable=False, unique=True, index=True)
    value = Column(JSON, nullable=False)
    description = Column(Text, nullable=True)

# AuditLog has been moved to administration module.
