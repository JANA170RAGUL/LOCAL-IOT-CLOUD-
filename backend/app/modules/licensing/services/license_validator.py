import logging
from sqlalchemy.orm import Session
from datetime import datetime, timezone

from app.modules.licensing.models.license import License
from app.modules.licensing.models.license_activation import LicenseActivation
from app.modules.licensing.models.license_feature import LicenseFeature
from app.modules.licensing.validators.machine_validator import validate_machine
from app.modules.licensing.services.feature_service import feature_service

logger = logging.getLogger(__name__)

def validate_active_license(db: Session) -> bool:
    """
    Validates the active license on startup.
    Returns True if valid, False otherwise.
    """
    # 1. Find the active license
    # For this simulated environment, we might not have a license yet, so we don't want to crash.
    license_obj = db.query(License).filter(License.status == "ACTIVE").first()
    
    if not license_obj:
        logger.warning("No ACTIVE license found in database. System running in UNLICENSED mode.")
        feature_service.clear_features()
        return False
        
    # 2. Check Expiry
    if license_obj.expires_at:
        expires_at_aware = license_obj.expires_at
        if expires_at_aware.tzinfo is None:
            expires_at_aware = expires_at_aware.replace(tzinfo=timezone.utc)
        if expires_at_aware < datetime.now(timezone.utc):
            logger.error(f"License {license_obj.license_key} expired on {license_obj.expires_at}.")
            license_obj.status = "Expired"
            db.commit()
            feature_service.clear_features()
            return False
        
    # 3. Check Machine Fingerprint binding
    activation = db.query(LicenseActivation).filter(LicenseActivation.license_id == license_obj.id).first()
    if not activation or not activation.fingerprint:
        logger.error("License is ACTIVE but has no valid machine binding.")
        feature_service.clear_features()
        return False
        
    expected_hash = activation.fingerprint.fingerprint_hash
    if not validate_machine(expected_hash):
        logger.error("Machine fingerprint validation failed! Software may have been copied.")
        feature_service.clear_features()
        return False
        
    # 4. Verify RSA Signature of raw_license_file
    import json
    from app.modules.licensing.crypto.verifier import verify_signature
    try:
        license_dict = json.loads(license_obj.raw_license_file)
        signature = license_dict.get("signature", "")
        payload = license_dict.copy()
        if "signature" in payload:
            del payload["signature"]
        
        if not verify_signature(payload, signature):
            logger.error("Database license RSA signature is invalid! System tampered with.")
            feature_service.clear_features()
            return False
    except Exception as e:
        logger.error(f"Failed to parse or verify stored license: {e}")
        feature_service.clear_features()
        return False
    
    # 5. Load Features
    features = db.query(LicenseFeature).filter(LicenseFeature.license_id == license_obj.id).all()
    feature_dict = {}
    for f in features:
        if f.feature_value_int is not None:
            feature_dict[f.feature_key] = f.feature_value_int
        elif f.feature_value_bool is not None:
            feature_dict[f.feature_key] = f.feature_value_bool
            
    feature_service.load_features(feature_dict)
    logger.info(f"License {license_obj.license_key} validated successfully. Features loaded.")
    return True
