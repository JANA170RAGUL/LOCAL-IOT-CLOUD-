"""
app/modules/tenants

Tenant lifecycle management (create, update, suspend, delete).

As the module is implemented, update this file to re-export:
    - router        (FastAPI router)
    - ORM models
    - Pydantic schemas
    - Service class
"""

from app.modules.tenants.api.router import router

__all__ = ["router"]
