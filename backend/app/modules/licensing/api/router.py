"""
app/modules/licensing/api/router.py

FastAPI router for the Licensing module.

Mounted at: /api/v1/licensing

License key management, feature flags, and usage metering.
"""

from fastapi import APIRouter

router = APIRouter(
    prefix="/licensing",
    tags=["Licensing"],
)


# ---------------------------------------------------------------------------
# Placeholder – replace with real endpoints as the module is implemented
# ---------------------------------------------------------------------------

@router.get("/", summary="List licensing", description="License key management, feature flags, and usage metering.")
def list_licensing() -> dict:
    """Stub endpoint – returns a not-implemented message."""
    return {
        "module": "licensing",
        "status": "not_implemented",
        "message": "This module is under construction.",
    }
