"""
app/modules/channels/api/router.py

FastAPI router for the Channels module.

Mounted at: /api/v1/channels

Data channels that route telemetry from devices to consumers.
"""

from fastapi import APIRouter

router = APIRouter(
    prefix="/channels",
    tags=["Channels"],
)


# ---------------------------------------------------------------------------
# Placeholder – replace with real endpoints as the module is implemented
# ---------------------------------------------------------------------------

@router.get("/", summary="List channels", description="Data channels that route telemetry from devices to consumers.")
def list_channels() -> dict:
    """Stub endpoint – returns a not-implemented message."""
    return {
        "module": "channels",
        "status": "not_implemented",
        "message": "This module is under construction.",
    }
