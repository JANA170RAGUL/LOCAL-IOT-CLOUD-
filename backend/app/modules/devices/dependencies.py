"""
app/modules/devices/dependencies.py

FastAPI Depends() helpers scoped to the Device module.
"""

from __future__ import annotations

from app.modules.devices.services.device_service import DeviceService


def get_device_service() -> DeviceService:
    """Provide a DeviceService instance for FastAPI dependency injection."""
    return DeviceService()
