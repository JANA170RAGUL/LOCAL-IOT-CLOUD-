"""
app/modules/projects/api/router.py

FastAPI router for the Projects module.

Mounted at: /api/v1/projects

Logical grouping of devices and assets within an organisation.
"""

from fastapi import APIRouter

router = APIRouter(
    prefix="/projects",
    tags=["Projects"],
)


# ---------------------------------------------------------------------------
# Placeholder – replace with real endpoints as the module is implemented
# ---------------------------------------------------------------------------

@router.get("/", summary="List projects", description="Logical grouping of devices and assets within an organisation.")
def list_projects() -> dict:
    """Stub endpoint – returns a not-implemented message."""
    return {
        "module": "projects",
        "status": "not_implemented",
        "message": "This module is under construction.",
    }
