"""
app/modules/authentication/api/router.py

FastAPI router for the Authentication module.

Mounted at: /api/v1/auth

User login, logout, token refresh, and password management.
"""

from fastapi import APIRouter

router = APIRouter(
    prefix="/auth",
    tags=["Authentication"],
)


# ---------------------------------------------------------------------------
# Placeholder – replace with real endpoints as the module is implemented
# ---------------------------------------------------------------------------

@router.get("/", summary="List authentication", description="User login, logout, token refresh, and password management.")
def list_authentication() -> dict:
    """Stub endpoint – returns a not-implemented message."""
    return {
        "module": "authentication",
        "status": "not_implemented",
        "message": "This module is under construction.",
    }
