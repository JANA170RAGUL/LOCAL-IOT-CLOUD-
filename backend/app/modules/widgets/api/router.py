"""
app/modules/widgets/api/router.py

FastAPI router for the Widgets module.

Mounted at: /api/v1/widgets

Reusable dashboard widget definitions and configurations.
"""

from fastapi import APIRouter

router = APIRouter(
    prefix="/widgets",
    tags=["Widgets"],
)


# ---------------------------------------------------------------------------
# Placeholder – replace with real endpoints as the module is implemented
# ---------------------------------------------------------------------------

@router.get("/", summary="List widgets", description="Reusable dashboard widget definitions and configurations.")
def list_widgets() -> dict:
    """Stub endpoint – returns a not-implemented message."""
    return {
        "module": "widgets",
        "status": "not_implemented",
        "message": "This module is under construction.",
    }
