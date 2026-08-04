from sqlalchemy import Column, String
from sqlalchemy.orm import relationship
from app.database.base import BaseModel

class MachineFingerprint(BaseModel):
    __tablename__ = "machine_fingerprints"

    cpu_id = Column(String(255), nullable=True)
    motherboard_serial = Column(String(255), nullable=True)
    disk_serial = Column(String(255), nullable=True)
    mac_address = Column(String(255), nullable=True)
    os_uuid = Column(String(255), nullable=True)
    
    fingerprint_hash = Column(String(255), unique=True, nullable=False, index=True)
    
    activations = relationship("LicenseActivation", back_populates="fingerprint", cascade="all, delete-orphan")
