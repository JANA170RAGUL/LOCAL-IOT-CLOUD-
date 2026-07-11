"""
app/modules/reports

Scheduled and on-demand PDF/CSV report generation.

As the module is implemented, update this file to re-export:
    - router        (FastAPI router)
    - ORM models
    - Pydantic schemas
    - Service class
"""

from app.modules.reports.api.router import router

__all__ = ["router"]
