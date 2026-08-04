from sqlalchemy import Column, String, Integer, Boolean, ForeignKey
from sqlalchemy.orm import relationship
from app.database.base import BaseModel

class LicenseFeature(BaseModel):
    __tablename__ = "license_features"

    license_id = Column(String(36), ForeignKey("licenses.id"), nullable=False, index=True)
    feature_key = Column(String(100), nullable=False, index=True) # e.g. 'devices', 'dashboards', 'analytics'
    
    # Store numeric limits (e.g. 5000 devices) or bool flags (e.g. AI enabled)
    # If a feature is unlimited, value might be -1 or null
    feature_value_int = Column(Integer, nullable=True)
    feature_value_bool = Column(Boolean, nullable=True)
    
    license = relationship("License", back_populates="features")
