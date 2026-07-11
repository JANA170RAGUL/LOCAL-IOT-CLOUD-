"""
app/modules/settings/dependencies.py

FastAPI ``Depends()`` helpers scoped to the Setting module.
"""

from __future__ import annotations

# from app.modules.settings.services.settings_service import SettingService  # noqa: E501
# Uncomment the import above once the service class is implemented.


def get_settings_service():  # type: ignore[return]
    """
    Provide a ``SettingService`` instance.
    Uncomment the body once the service class is implemented.
    """
    # return SettingService()
    raise NotImplementedError("SettingService is not yet implemented.")
