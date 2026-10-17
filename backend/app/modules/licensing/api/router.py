"""
app/modules/licensing/api/router.py

FastAPI router for the Licensing module.
Mounted under /api/v1/licensing.
Provides status evaluation, atomic license upload/replacement, and usage telemetry metering.
"""

from __future__ import annotations

import json
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from sqlalchemy.orm import Session

from app.core.auth import get_current_user, require_permission
from app.database.session import get_db
from app.modules.licensing.crypto.verifier import verify_signature
from app.modules.licensing.features import LicenseFeature
from app.modules.licensing.models.license import License
from app.modules.licensing.models.license_activation import LicenseActivation
from app.modules.licensing.models.license_feature import LicenseFeature as DBLicenseFeature
from app.modules.licensing.models.machine_fingerprint import MachineFingerprint
from app.modules.licensing.policy.models import LicenseRecordStatus
from app.modules.licensing.schemas.license_file import SignedLicenseFile
from app.modules.licensing.services.fingerprint_service import generate_fingerprint
from app.modules.licensing.services.license_policy import license_policy
from app.modules.licensing.services.license_usage import license_usage
from app.modules.licensing.validators.machine_validator import validate_machine
from app.modules.users.models.user import User

LICENSE_UPLOAD_MAX_BYTES = 64 * 1024

router = APIRouter(
    prefix="/licensing",
    tags=["Licensing"],
)


@router.get("/status", summary="Get License Status")
def get_license_status(db: Session = Depends(get_db)):
    """
    Returns public-safe license evaluation status, plan, expiry, and grace dates.
    Available in RESTRICTED / UNLICENSED mode.
    """
    snapshot = license_policy.get_snapshot(db)
    return {
        "mode": snapshot.mode.value,
        "license_id": snapshot.license_id,
        "plan": snapshot.plan,
        "expires_at": snapshot.expires_at.isoformat() if snapshot.expires_at else None,
        "grace_ends_at": snapshot.grace_ends_at.isoformat() if snapshot.grace_ends_at else None,
        "reason": snapshot.reason,
        "features": snapshot.features,
    }


@router.get("/machine-code", summary="Get Machine Code")
def get_machine_code(current_user: User = Depends(require_permission("system:admin"))):
    """
    Returns derived machine fingerprint hash for license generation.
    Requires Super Admin permission.
    """
    fingerprint = generate_fingerprint()
    return {
        "machine_code": fingerprint["fingerprint_hash"],
        "algorithm": "localiot-machine-v1",
    }


@router.get("/usage", summary="Get License Usage Metrics")
def get_license_usage(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("system:admin")),
):
    """
    Returns consumed versus licensed capacity for Super Admin.
    """
    snapshot = license_policy.get_snapshot(db)
    features = snapshot.features

    def _capacity_dict(feat: LicenseFeature, count: int) -> dict:
        limit = features.get(feat.value, 0)
        return {
            "used": count,
            "limit": limit if isinstance(limit, int) else 0,
        }

    return {
        "mode": snapshot.mode.value,
        "organizations": _capacity_dict(LicenseFeature.ORGANIZATIONS, license_usage.count_organizations(db)),
        "users": _capacity_dict(LicenseFeature.USERS, license_usage.count_users(db)),
        "gateways": _capacity_dict(LicenseFeature.GATEWAYS, license_usage.count_gateways(db)),
        "devices": _capacity_dict(LicenseFeature.DEVICES, license_usage.count_devices(db)),
        "dashboards": _capacity_dict(LicenseFeature.DASHBOARDS, license_usage.count_dashboards(db)),
        "widgets": _capacity_dict(LicenseFeature.WIDGETS, license_usage.count_widgets(db)),
        "channels": _capacity_dict(LicenseFeature.CHANNELS, license_usage.count_channels(db)),
        "telemetry_rate": {
            "limit_per_second": features.get(LicenseFeature.TELEMETRY_RATE.value, 0),
        },
        "flags": {
            "analytics": bool(features.get(LicenseFeature.ANALYTICS.value, False)),
            "reports": bool(features.get(LicenseFeature.REPORTS.value, False)),
            "remote_commands": bool(features.get(LicenseFeature.REMOTE_COMMANDS.value, False)),
            "ai": bool(features.get(LicenseFeature.AI.value, False)),
        },
    }


@router.post("/upload", summary="Upload and Activate License")
async def upload_license(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("system:admin")),
):
    """
    Atomically uploads and activates a vendor-signed .lic file.
    Requires Super Admin permission. Allowed in RESTRICTED / UNLICENSED mode.
    """
    if not file.filename or not file.filename.endswith(".lic"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File must have a .lic extension.",
        )

    content = await file.read(LICENSE_UPLOAD_MAX_BYTES + 1)
    if len(content) > LICENSE_UPLOAD_MAX_BYTES:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"License file exceeds maximum allowed size ({LICENSE_UPLOAD_MAX_BYTES} bytes).",
        )

    try:
        raw_str = content.decode("utf-8")
        raw_dict = json.loads(raw_str)
        signed_file = SignedLicenseFile.model_validate(raw_dict)
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid license file schema: {exc}",
        )

    # 1. Verify RSA Signature using public.pem
    payload = raw_dict.copy()
    sig = payload.pop("signature", "")
    if not verify_signature(payload, sig):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="License signature validation failed! Tampered payload or invalid key.",
        )

    # 2. Check Machine Binding
    current_machine = generate_fingerprint()
    if signed_file.machine != current_machine["fingerprint_hash"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="License machine code does not match this server environment.",
        )

    # 3. Atomic Replacement in DB Transaction
    try:
        # Mark previous active licenses as REPLACED
        existing_active = db.query(License).filter(License.status == LicenseRecordStatus.ACTIVE.value).all()
        for old in existing_active:
            old.status = LicenseRecordStatus.REPLACED.value

        # Machine Fingerprint record
        fp_rec = db.query(MachineFingerprint).filter(
            MachineFingerprint.fingerprint_hash == current_machine["fingerprint_hash"]
        ).first()
        if not fp_rec:
            fp_rec = MachineFingerprint(
                cpu_id=current_machine["cpu_id"],
                motherboard_serial=current_machine["motherboard_serial"],
                disk_serial=current_machine["disk_serial"],
                mac_address=current_machine["mac_address"],
                os_uuid=current_machine["os_uuid"],
                fingerprint_hash=current_machine["fingerprint_hash"],
            )
            db.add(fp_rec)
            db.flush()

        # Insert new License
        new_license = License(
            customer_name=signed_file.customer,
            license_key=signed_file.license_id,
            plan=signed_file.plan,
            status=LicenseRecordStatus.ACTIVE.value,
            expires_at=signed_file.expires_at,
            raw_license_file=raw_str,
            signature=signed_file.signature,
        )
        db.add(new_license)
        db.flush()

        # Insert features
        for k, v in signed_file.features.items():
            feat = DBLicenseFeature(
                license_id=new_license.id,
                feature_key=k,
            )
            if isinstance(v, bool):
                feat.feature_value_bool = v
            elif isinstance(v, int):
                feat.feature_value_int = v
            db.add(feat)

        # Insert activation record
        activation = LicenseActivation(
            license_id=new_license.id,
            fingerprint_id=fp_rec.id,
            activated_at=datetime.now(timezone.utc),
        )
        db.add(activation)

        db.commit()
    except Exception as exc:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to persist replacement license: {exc}",
        )

    # Invalidate process-local policy cache
    license_policy.invalidate()

    return {
        "message": "License uploaded and activated successfully.",
        "license_id": new_license.license_key,
        "customer": new_license.customer_name,
        "plan": new_license.plan,
    }
