"""
app/modules/widgets/dependencies.py

FastAPI ``Depends()`` helpers scoped to the Widget module.
"""

from __future__ import annotations

# from app.modules.widgets.services.widget_service import WidgetService  # noqa: E501
# Uncomment the import above once the service class is implemented.


def get_widget_service():  # type: ignore[return]
    """
    Provide a ``WidgetService`` instance.
    Uncomment the body once the service class is implemented.
    """
    # return WidgetService()
    raise NotImplementedError("WidgetService is not yet implemented.")
