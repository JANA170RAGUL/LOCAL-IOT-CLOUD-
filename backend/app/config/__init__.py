"""app/config package – exposes the singleton `settings` object."""

from app.config.settings import Settings, get_settings, settings

__all__ = ["Settings", "get_settings", "settings"]
