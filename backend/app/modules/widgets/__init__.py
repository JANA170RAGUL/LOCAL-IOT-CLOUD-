"""
app/modules/widgets

Reusable dashboard widget definitions and configurations.

As the module is implemented, update this file to re-export:
    - router        (FastAPI router)
    - ORM models
    - Pydantic schemas
    - Service class
"""

from app.modules.widgets.api.router import router

__all__ = ["router"]
