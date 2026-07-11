"""
app/modules/rules

Condition-based automation rules that trigger alerts or actions.

As the module is implemented, update this file to re-export:
    - router        (FastAPI router)
    - ORM models
    - Pydantic schemas
    - Service class
"""

from app.modules.rules.api.router import router

__all__ = ["router"]
