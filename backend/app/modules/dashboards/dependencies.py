"""
app/modules/dashboards/dependencies.py

FastAPI dependency injectors for the Dashboard module.
"""

from app.modules.dashboards.repositories.dashboard_repository import DashboardRepository
from app.modules.dashboards.services.dashboard_service import DashboardService

# Singletons for repository and service
dashboard_repo = DashboardRepository()
dashboard_svc = DashboardService(dashboard_repo)


def get_dashboard_service() -> DashboardService:
    """Return the global DashboardService instance."""
    return dashboard_svc
