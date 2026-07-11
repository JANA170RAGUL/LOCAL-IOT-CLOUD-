"""
app/modules/devices

IoT device management: registration, configuration, and lifecycle.

As the module is implemented, update this file to re-export:
    - router        (FastAPI router)
    - ORM models
    - Pydantic schemas
    - Service class
"""

from app.modules.devices.api.router import router

__all__ = ["router"]
