"""
app/modules/channels

Data channels that route telemetry from devices to consumers.

As the module is implemented, update this file to re-export:
    - router        (FastAPI router)
    - ORM models
    - Pydantic schemas
    - Service class
"""

from app.modules.channels.api.router import router

__all__ = ["router"]
