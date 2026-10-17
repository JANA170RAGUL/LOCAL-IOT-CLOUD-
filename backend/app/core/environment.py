"""
app/core/environment.py

Production and demo boundary helpers for LocalIoTCloud.
"""

from fastapi import HTTPException
from app.config.settings import settings


def require_non_production(feature_name: str) -> None:
    """Raises HTTP 404 in production to keep dev/demo endpoints invisible."""
    if settings.app_env == "production":
        raise HTTPException(
            status_code=404,
            detail="Not found.",
        )


def demo_data_allowed() -> bool:
    """Returns True only if environment is non-production AND allow_demo_data is explicitly enabled."""
    return (
        settings.app_env in {"development", "test"}
        and settings.allow_demo_data
    )


def simulators_allowed() -> bool:
    """Returns True only if environment is non-production AND allow_simulators is explicitly enabled."""
    return (
        settings.app_env in {"development", "test"}
        and settings.allow_simulators
    )
