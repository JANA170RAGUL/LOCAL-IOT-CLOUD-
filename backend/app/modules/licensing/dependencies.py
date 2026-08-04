"""
app/modules/licensing/dependencies.py

FastAPI ``Depends()`` helpers scoped to the License module.
"""

from __future__ import annotations

# from app.modules.licensing.services.licensing_service import LicenseService  # noqa: E501
# Uncomment the import above once the service class is implemented.


from fastapi import HTTPException, status
from typing import Callable
from app.modules.licensing.services.feature_service import feature_service

def require_valid_license():
    """
    Dependency to ensure the platform has a valid, active license.
    """
    if not feature_service.has_valid_license():
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Platform is running in UNLICENSED or READ-ONLY mode. Action denied."
        )

def require_feature(feature_key: str) -> Callable:
    """
    Dependency factory to ensure a specific feature is enabled in the active license.
    """
    def _dependency():
        # First ensure license is valid overall
        require_valid_license()
        
        # Check specific feature
        if not feature_service.is_feature_enabled(feature_key):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"License does not permit feature: {feature_key}"
            )
    return _dependency

def check_feature_limit(feature_key: str, current_count: int):
    """
    Helper function to check numeric limits. Usually called inside service layer, not directly as a FastAPI dependency.
    """
    limit = feature_service.get_feature_limit(feature_key)
    if limit is not None and limit != -1: # -1 could represent unlimited
        if current_count >= limit:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"License limit reached for {feature_key}. Maximum allowed: {limit}."
            )
