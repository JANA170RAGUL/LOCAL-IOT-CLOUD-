"""
app/modules/assets/api/router.py

FastAPI router for the Assets module.

Mounted at: /api/v1/assets

Physical or logical IoT assets tracked by the platform.
"""

from fastapi import APIRouter

router = APIRouter(
    prefix="/assets",
    tags=["Assets"],
)


# ---------------------------------------------------------------------------
# Placeholder – replace with real endpoints as the module is implemented
# ---------------------------------------------------------------------------

@router.get("/", summary="List assets", description="Physical or logical IoT assets tracked by the platform.")
def list_assets() -> dict:
    """Stub endpoint – returns a not-implemented message."""
    return {
        "module": "assets",
        "status": "not_implemented",
        "message": "This module is under construction.",
    }
