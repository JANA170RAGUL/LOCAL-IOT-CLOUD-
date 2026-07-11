"""
app/modules/settings/api/router.py

FastAPI router for the Settings module.

Mounted at: /api/v1/settings

Platform, tenant, and organisation-level configuration settings.
"""

from fastapi import APIRouter

router = APIRouter(
    prefix="/settings",
    tags=["Settings"],
)


# ---------------------------------------------------------------------------
# Placeholder – replace with real endpoints as the module is implemented
# ---------------------------------------------------------------------------

@router.get("/", summary="List settings", description="Platform, tenant, and organisation-level configuration settings.")
def list_settings() -> dict:
    """Stub endpoint – returns a not-implemented message."""
    return {
        "module": "settings",
        "status": "not_implemented",
        "message": "This module is under construction.",
    }
