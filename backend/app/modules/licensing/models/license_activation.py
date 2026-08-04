from sqlalchemy import Column, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.database.base import BaseModel

class LicenseActivation(BaseModel):
    __tablename__ = "license_activations"

    license_id = Column(String(36), ForeignKey("licenses.id"), nullable=False, index=True)
    fingerprint_id = Column(String(36), ForeignKey("machine_fingerprints.id"), nullable=False, index=True)
    
    activated_at = Column(DateTime, nullable=False)
    last_verified_at = Column(DateTime, nullable=True)
    
    license = relationship("License", back_populates="activations")
    fingerprint = relationship("MachineFingerprint", back_populates="activations")
