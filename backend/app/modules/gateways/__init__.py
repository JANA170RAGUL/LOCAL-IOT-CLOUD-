"""
app/modules/gateways

Edge gateway registration, provisioning, and status tracking.

As the module is implemented, update this file to re-export:
    - router        (FastAPI router)
    - ORM models
    - Pydantic schemas
    - Service class
"""

from app.modules.gateways.api.router import router

__all__ = ["router"]
