"""
app/modules/reports/api/router.py

FastAPI router for the Reports module.

Mounted at: /api/v1/reports

Scheduled and on-demand PDF/CSV report generation.
"""

from fastapi import APIRouter

router = APIRouter(
    prefix="/reports",
    tags=["Reports"],
)


# ---------------------------------------------------------------------------
# Placeholder – replace with real endpoints as the module is implemented
# ---------------------------------------------------------------------------

@router.get("/", summary="List reports", description="Scheduled and on-demand PDF/CSV report generation.")
def list_reports() -> dict:
    """Stub endpoint – returns a not-implemented message."""
    return {
        "module": "reports",
        "status": "not_implemented",
        "message": "This module is under construction.",
    }
