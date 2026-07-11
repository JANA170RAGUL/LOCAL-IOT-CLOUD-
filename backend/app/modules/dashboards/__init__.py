"""
app/modules/dashboards

Dashboard definitions composed of widgets for data visualisation.

As the module is implemented, update this file to re-export:
    - router        (FastAPI router)
    - ORM models
    - Pydantic schemas
    - Service class
"""

from app.modules.dashboards.api.router import router

__all__ = ["router"]
