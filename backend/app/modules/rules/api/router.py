"""
app/modules/rules/api/router.py

FastAPI router for the Rules module.

Mounted at: /api/v1/rules

Condition-based automation rules that trigger alerts or actions.
"""

from fastapi import APIRouter

router = APIRouter(
    prefix="/rules",
    tags=["Rules"],
)


# ---------------------------------------------------------------------------
# Placeholder – replace with real endpoints as the module is implemented
# ---------------------------------------------------------------------------

@router.get("/", summary="List rules", description="Condition-based automation rules that trigger alerts or actions.")
def list_rules() -> dict:
    """Stub endpoint – returns a not-implemented message."""
    return {
        "module": "rules",
        "status": "not_implemented",
        "message": "This module is under construction.",
    }
