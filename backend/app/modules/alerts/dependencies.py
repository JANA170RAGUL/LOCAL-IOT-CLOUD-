"""
app/modules/alerts/dependencies.py

FastAPI ``Depends()`` helpers scoped to the Alert module.
"""

from __future__ import annotations

from app.modules.alerts.services.alert_service import AlertService
from app.modules.alerts.repositories.alert_repository import AlertRepository


def get_alert_service() -> AlertService:
    """
    Provide a ``AlertService`` instance.
    """
    return AlertService(AlertRepository())
