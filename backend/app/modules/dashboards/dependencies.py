"""
app/modules/dashboards/dependencies.py

FastAPI ``Depends()`` helpers scoped to the Dashboard module.
"""

from __future__ import annotations

# from app.modules.dashboards.services.dashboard_service import DashboardService  # noqa: E501
# Uncomment the import above once the service class is implemented.


def get_dashboard_service():  # type: ignore[return]
    """
    Provide a ``DashboardService`` instance.
    Uncomment the body once the service class is implemented.
    """
    # return DashboardService()
    raise NotImplementedError("DashboardService is not yet implemented.")
