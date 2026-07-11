"""
app/modules/notifications/api/router.py

FastAPI router for the Notifications module.

Mounted at: /api/v1/notifications

Outbound notification dispatch: email, SMS, push, webhook.
"""

from fastapi import APIRouter

router = APIRouter(
    prefix="/notifications",
    tags=["Notifications"],
)


# ---------------------------------------------------------------------------
# Placeholder – replace with real endpoints as the module is implemented
# ---------------------------------------------------------------------------

@router.get("/", summary="List notifications", description="Outbound notification dispatch: email, SMS, push, webhook.")
def list_notifications() -> dict:
    """Stub endpoint – returns a not-implemented message."""
    return {
        "module": "notifications",
        "status": "not_implemented",
        "message": "This module is under construction.",
    }
