"""
app/modules/licensing/api/router.py

FastAPI router for the Licensing module.

Mounted at: /api/v1/licensing

License key management, feature flags, and usage metering.
"""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from datetime import datetime, timezone

from app.database.session import get_db
from app.modules.licensing.models.license import License
from app.modules.licensing.models.license_feature import LicenseFeature
from app.modules.licensing.models.license_activation import LicenseActivation
from app.modules.licensing.models.machine_fingerprint import MachineFingerprint
from app.modules.licensing.validators.machine_validator import validate_machine
from app.modules.licensing.services.feature_service import feature_service
from app.modules.licensing.services.fingerprint_service import generate_fingerprint

router = APIRouter(
    prefix="/license",
    tags=["Licensing"],
)

@router.get("/status", summary="Get License Status")
def get_license_status(db: Session = Depends(get_db)):
    # Find the active license
    license_obj = db.query(License).filter(License.status == "ACTIVE").first()
    
    if not license_obj:
        return {
            "status": "UNLICENSED",
            "message": "No active license found on this platform."
        }
        
    activation = db.query(LicenseActivation).filter(LicenseActivation.license_id == license_obj.id).first()
    machine_match = False
    if activation and activation.fingerprint:
        machine_match = validate_machine(activation.fingerprint.fingerprint_hash)
        
    expires_in_days = -1
    if license_obj.expires_at:
        delta = license_obj.expires_at.replace(tzinfo=timezone.utc) - datetime.now(timezone.utc)
        expires_in_days = delta.days
        
    current_machine_data = generate_fingerprint()
    return {
        "customer": license_obj.customer_name if license_obj else None,
        "plan": license_obj.plan if license_obj else None,
        "status": license_obj.status if license_obj else "UNLICENSED",
        "expires_in_days": expires_in_days,
        "machine_match": machine_match,
        "features_loaded": len(feature_service.features) if feature_service.features else 0,
        "current_fingerprint": current_machine_data["fingerprint_hash"],
        "activated_at": activation.activated_at.isoformat() if activation and activation.activated_at else None,
        "features": feature_service.features
    }

from fastapi import UploadFile, File, HTTPException
from app.modules.licensing.services.license_parser import parse_and_validate_license
from app.modules.licensing.models.machine_fingerprint import MachineFingerprint

@router.post("/upload", summary="Upload and Activate License")
async def upload_license(file: UploadFile = File(...), db: Session = Depends(get_db)):
    if not file.filename.endswith('.lic'):
        raise HTTPException(status_code=400, detail="Must be a .lic file")
        
    content = await file.read()
    raw_str = content.decode('utf-8')
    
    # 1. Parse and Validate RSA Signature + Structure
    license_data = parse_and_validate_license(raw_str)
    
    # 2. Check Machine Fingerprint
    expected_machine = license_data.get("machine")
    current_machine_data = generate_fingerprint()
    if expected_machine != current_machine_data["fingerprint_hash"]:
        raise HTTPException(status_code=403, detail="License is bound to a different machine fingerprint.")
        
    # 3. Deactivate current active license
    existing_active = db.query(License).filter(License.status == "ACTIVE").all()
    for el in existing_active:
        el.status = "Replaced"
        
    # 4. Save new Machine Fingerprint if it doesn't exist
    fingerprint_record = db.query(MachineFingerprint).filter(MachineFingerprint.fingerprint_hash == current_machine_data["fingerprint_hash"]).first()
    if not fingerprint_record:
        fingerprint_record = MachineFingerprint(
            cpu_id=current_machine_data["cpu_id"],
            motherboard_serial=current_machine_data["motherboard_serial"],
            disk_serial=current_machine_data["disk_serial"],
            mac_address=current_machine_data["mac_address"],
            os_uuid=current_machine_data["os_uuid"],
            fingerprint_hash=current_machine_data["fingerprint_hash"]
        )
        db.add(fingerprint_record)
        db.flush() # get ID
        
    # 5. Insert new License
    expires_str = license_data["expires"]
    if "T" not in expires_str:
        expires_str += "T23:59:59Z"
    expires_at = datetime.fromisoformat(expires_str.replace("Z", "+00:00"))
    
    new_license = License(
        customer_name=license_data["customer"],
        license_key=license_data["license_key"],
        plan=license_data["plan"],
        status="ACTIVE",
        expires_at=expires_at,
        raw_license_file=raw_str,
        signature=license_data["signature"]
    )
    db.add(new_license)
    db.flush()
    
    # 6. Insert Features
    feature_dict = {}
    for k, v in license_data.get("features", {}).items():
        feat = LicenseFeature(
            license_id=new_license.id,
            feature_key=k,
        )
        if isinstance(v, bool):
            feat.feature_value_bool = v
            feature_dict[k] = v
        elif isinstance(v, int):
            feat.feature_value_int = v
            feature_dict[k] = v
        db.add(feat)
        
    # 7. Insert Activation
    activation = LicenseActivation(
        license_id=new_license.id,
        fingerprint_id=fingerprint_record.id,
        activated_at=datetime.now(timezone.utc)
    )
    db.add(activation)
    
    db.commit()
    
    # 8. Reload Features into memory
    feature_service.load_features(feature_dict)
    
    return {
        "message": "License uploaded and activated successfully.",
        "customer": new_license.customer_name,
        "plan": new_license.plan
    }
