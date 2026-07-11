"""
app/modules/notifications

Outbound notification dispatch: email, SMS, push, webhook.

As the module is implemented, update this file to re-export:
    - router        (FastAPI router)
    - ORM models
    - Pydantic schemas
    - Service class
"""

from app.modules.notifications.api.router import router

__all__ = ["router"]
