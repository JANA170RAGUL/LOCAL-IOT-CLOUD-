"""
app/modules/licensing/dependencies.py

FastAPI Depends() helpers for licensing enforcement in LocalIoTCloud.
Uses authoritative LicensePolicyService to enforce license validity and feature flags.
"""

from __future__ import annotations

from typing import Callable
from fastapi import Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.modules.licensing.features import LicenseFeature
from app.modules.licensing.policy.models import LicenseOperation
from app.modules.licensing.services.license_policy import license_policy


def require_valid_license(db: Session = Depends(get_db)):
    """
    Dependency ensuring the platform has a valid, active license.
    """
    snapshot = license_policy.get_snapshot(db)
    license_policy.ensure_operation(snapshot, LicenseOperation.READ)


def require_feature(feature_key: str | LicenseFeature) -> Callable:
    """
    Dependency factory ensuring a specific feature is enabled in the active license.
    """
    feature_name = feature_key.value if isinstance(feature_key, LicenseFeature) else feature_key
    try:
        enum_feature = LicenseFeature(feature_name)
    except ValueError:
        enum_feature = None

    def _dependency(db: Session = Depends(get_db)):
        snapshot = license_policy.get_snapshot(db)
        if enum_feature:
            license_policy.ensure_feature(snapshot, enum_feature)
        else:
            val = snapshot.features.get(feature_name)
            if type(val) is not bool or not val:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail=f"License does not permit feature: {feature_name}",
                )

    return _dependency


def check_feature_limit(feature_key: str | LicenseFeature, current_count: int, db: Session | None = None):
    """
    Helper function to check numeric limits against current usage.
    """
    if db is None:
        return
    snapshot = license_policy.get_snapshot(db)
    feature_name = feature_key.value if isinstance(feature_key, LicenseFeature) else feature_key
    try:
        enum_feature = LicenseFeature(feature_name)
        license_policy.ensure_capacity(snapshot, enum_feature, current_count=current_count)
    except ValueError:
        pass
