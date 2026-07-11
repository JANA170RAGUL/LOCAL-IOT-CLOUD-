"""
app/modules/assets

Physical or logical IoT assets tracked by the platform.

As the module is implemented, update this file to re-export:
    - router        (FastAPI router)
    - ORM models
    - Pydantic schemas
    - Service class
"""

from app.modules.assets.api.router import router

__all__ = ["router"]
