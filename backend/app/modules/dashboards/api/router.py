"""
app/modules/dashboards/api/router.py

FastAPI router for the Dashboards module.

Mounted at: /api/v1/dashboards

Dashboard definitions composed of widgets for data visualisation.
"""

from fastapi import APIRouter

router = APIRouter(
    prefix="/dashboards",
    tags=["Dashboards"],
)


# ---------------------------------------------------------------------------
# Placeholder – replace with real endpoints as the module is implemented
# ---------------------------------------------------------------------------

@router.get("/", summary="List dashboards", description="Dashboard definitions composed of widgets for data visualisation.")
def list_dashboards() -> dict:
    """Stub endpoint – returns a not-implemented message."""
    return {
        "module": "dashboards",
        "status": "not_implemented",
        "message": "This module is under construction.",
    }
