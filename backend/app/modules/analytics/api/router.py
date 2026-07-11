"""
app/modules/analytics/api/router.py

FastAPI router for the Analytics module.

Mounted at: /api/v1/analytics

Aggregated analytics reports and KPI computations.
"""

from fastapi import APIRouter

router = APIRouter(
    prefix="/analytics",
    tags=["Analytics"],
)


# ---------------------------------------------------------------------------
# Placeholder – replace with real endpoints as the module is implemented
# ---------------------------------------------------------------------------

@router.get("/", summary="List analytics", description="Aggregated analytics reports and KPI computations.")
def list_analytics() -> dict:
    """Stub endpoint – returns a not-implemented message."""
    return {
        "module": "analytics",
        "status": "not_implemented",
        "message": "This module is under construction.",
    }
