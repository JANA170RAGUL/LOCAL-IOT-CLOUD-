"""
app/core/config.py

Re-exports central Settings instance from app.config.settings.
"""

from app.config.settings import settings, Settings, get_settings

__all__ = ["settings", "Settings", "get_settings"]
