"""
app/modules/settings

Platform, tenant, and organisation-level configuration settings.

As the module is implemented, update this file to re-export:
    - router        (FastAPI router)
    - ORM models
    - Pydantic schemas
    - Service class
"""

from app.modules.settings.api.router import router

__all__ = ["router"]
