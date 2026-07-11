"""
app/modules/tenants/api/router.py

FastAPI router for the Tenants module.

Mounted at: /api/v1/tenants

Tenant lifecycle management (create, update, suspend, delete).
"""

from fastapi import APIRouter

router = APIRouter(
    prefix="/tenants",
    tags=["Tenants"],
)


# ---------------------------------------------------------------------------
# Placeholder – replace with real endpoints as the module is implemented
# ---------------------------------------------------------------------------

@router.get("/", summary="List tenants", description="Tenant lifecycle management (create, update, suspend, delete).")
def list_tenants() -> dict:
    """Stub endpoint – returns a not-implemented message."""
    return {
        "module": "tenants",
        "status": "not_implemented",
        "message": "This module is under construction.",
    }
