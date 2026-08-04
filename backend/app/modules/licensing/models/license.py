from sqlalchemy import Column, String, Text, DateTime
from sqlalchemy.orm import relationship
from app.database.base import BaseModel

class License(BaseModel):
    __tablename__ = "licenses"

    customer_name = Column(String(255), nullable=False)
    license_key = Column(String(100), unique=True, nullable=False, index=True)
    plan = Column(String(50), nullable=False) # Trial, Starter, Professional, Enterprise, Unlimited
    status = Column(String(50), nullable=False, default="Pending") # Active, Expired, Suspended, Revoked, Pending
    expires_at = Column(DateTime, nullable=True)
    
    raw_license_file = Column(Text, nullable=False)
    signature = Column(Text, nullable=False)
    
    features = relationship("LicenseFeature", back_populates="license", cascade="all, delete-orphan")
    activations = relationship("LicenseActivation", back_populates="license", cascade="all, delete-orphan")
