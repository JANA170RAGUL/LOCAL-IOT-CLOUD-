"""
app/modules/authentication

User login, logout, token refresh, and password management.

As the module is implemented, update this file to re-export:
    - router        (FastAPI router)
    - ORM models
    - Pydantic schemas
    - Service class
"""

from app.modules.authentication.api.router import router

__all__ = ["router"]
