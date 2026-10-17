"""
app/modules/licensing/services/license_validator.py

Startup license validation helper delegating to LicensePolicyService.
"""

from __future__ import annotations

import logging
from sqlalchemy.orm import Session

from app.modules.licensing.policy.models import LicenseMode
from app.modules.licensing.services.license_policy import license_policy

logger = logging.getLogger(__name__)


def validate_active_license(db: Session) -> bool:
    """
    Validates the active license on startup using LicensePolicyService.
    Returns True if in VALID or GRACE mode, False otherwise.
    """
    license_policy.invalidate()
    snapshot = license_policy.get_snapshot(db)

    if snapshot.mode in {LicenseMode.VALID, LicenseMode.GRACE}:
        logger.info(f"License validated successfully (Mode: {snapshot.mode.value}, Plan: {snapshot.plan}).")
        return True

    logger.warning(f"License evaluation status: {snapshot.mode.value} - {snapshot.reason}")
    return False
