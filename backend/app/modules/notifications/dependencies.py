"""
app/modules/notifications/dependencies.py

FastAPI ``Depends()`` helpers scoped to the Notification module.
"""

from __future__ import annotations

# from app.modules.notifications.services.notification_service import NotificationService  # noqa: E501
# Uncomment the import above once the service class is implemented.


def get_notification_service():  # type: ignore[return]
    """
    Provide a ``NotificationService`` instance.
    Uncomment the body once the service class is implemented.
    """
    # return NotificationService()
    raise NotImplementedError("NotificationService is not yet implemented.")
