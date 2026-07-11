"""
app/modules/gateways/api/router.py

FastAPI router for the Gateways module.

Mounted at: /api/v1/gateways

Edge gateway registration, provisioning, and status tracking.
"""

from fastapi import APIRouter

router = APIRouter(
    prefix="/gateways",
    tags=["Gateways"],
)


# ---------------------------------------------------------------------------
# Placeholder – replace with real endpoints as the module is implemented
# ---------------------------------------------------------------------------

@router.get("/", summary="List gateways", description="Edge gateway registration, provisioning, and status tracking.")
def list_gateways() -> dict:
    """Stub endpoint – returns a not-implemented message."""
    return {
        "module": "gateways",
        "status": "not_implemented",
        "message": "This module is under construction.",
    }
