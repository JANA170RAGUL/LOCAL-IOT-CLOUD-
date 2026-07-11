"""
app/modules/analytics

Aggregated analytics reports and KPI computations.

As the module is implemented, update this file to re-export:
    - router        (FastAPI router)
    - ORM models
    - Pydantic schemas
    - Service class
"""

from app.modules.analytics.api.router import router

__all__ = ["router"]
