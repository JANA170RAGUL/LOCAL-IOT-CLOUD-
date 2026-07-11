"""
app/modules/projects

Logical grouping of devices and assets within an organisation.

As the module is implemented, update this file to re-export:
    - router        (FastAPI router)
    - ORM models
    - Pydantic schemas
    - Service class
"""

from app.modules.projects.api.router import router

__all__ = ["router"]
