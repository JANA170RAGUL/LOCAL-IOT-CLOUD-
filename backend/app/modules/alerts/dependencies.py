"""
app/modules/alerts/dependencies.py

FastAPI ``Depends()`` helpers scoped to the Alert module.
"""

from __future__ import annotations

# from app.modules.alerts.services.alert_service import AlertService  # noqa: E501
# Uncomment the import above once the service class is implemented.


def get_alert_service():  # type: ignore[return]
    """
    Provide a ``AlertService`` instance.
    Uncomment the body once the service class is implemented.
    """
    # return AlertService()
    raise NotImplementedError("AlertService is not yet implemented.")
