"""
app/modules/devices/api/router.py

FastAPI router for the Devices module.

Mounted at: /api/v1/devices

IoT device management: registration, configuration, and lifecycle.
"""

from fastapi import APIRouter

router = APIRouter(
    prefix="/devices",
    tags=["Devices"],
)


# ---------------------------------------------------------------------------
# Placeholder – replace with real endpoints as the module is implemented
# ---------------------------------------------------------------------------

@router.get("/", summary="List devices", description="IoT device management: registration, configuration, and lifecycle.")
def list_devices() -> dict:
    """Stub endpoint – returns a not-implemented message."""
    return {
        "module": "devices",
        "status": "not_implemented",
        "message": "This module is under construction.",
    }
