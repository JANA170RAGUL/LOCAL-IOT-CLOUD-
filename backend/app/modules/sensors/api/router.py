"""
app/modules/sensors/api/router.py

FastAPI router for the Sensors module.

Mounted at: /api/v1/sensors

Sensor definitions and configuration attached to devices.
"""

from fastapi import APIRouter

router = APIRouter(
    prefix="/sensors",
    tags=["Sensors"],
)


# ---------------------------------------------------------------------------
# Placeholder – replace with real endpoints as the module is implemented
# ---------------------------------------------------------------------------

@router.get("/", summary="List sensors", description="Sensor definitions and configuration attached to devices.")
def list_sensors() -> dict:
    """Stub endpoint – returns a not-implemented message."""
    return {
        "module": "sensors",
        "status": "not_implemented",
        "message": "This module is under construction.",
    }
