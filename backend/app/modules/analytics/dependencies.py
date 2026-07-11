"""
app/modules/analytics/dependencies.py

FastAPI ``Depends()`` helpers scoped to the Analytics module.
"""

from __future__ import annotations

# from app.modules.analytics.services.analytics_service import AnalyticsService  # noqa: E501
# Uncomment the import above once the service class is implemented.


def get_analytics_service():  # type: ignore[return]
    """
    Provide a ``AnalyticsService`` instance.
    Uncomment the body once the service class is implemented.
    """
    # return AnalyticsService()
    raise NotImplementedError("AnalyticsService is not yet implemented.")
