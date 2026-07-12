"""
app/modules/widgets/dependencies.py

FastAPI dependency injectors for the Widget module.
"""

from app.modules.widgets.repositories.widget_repository import WidgetRepository
from app.modules.widgets.services.widget_service import WidgetService

# Singletons for repository and service
widget_repo = WidgetRepository()
widget_svc = WidgetService(widget_repo)


def get_widget_service() -> WidgetService:
    """Return the global WidgetService instance."""
    return widget_svc
