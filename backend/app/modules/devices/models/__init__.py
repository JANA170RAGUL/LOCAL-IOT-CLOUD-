"""app/modules/devices/models package."""

from app.modules.devices.models.device import Device
from app.modules.devices.models.device_credential import DeviceCredential

__all__ = [
    "Device",
    "DeviceCredential",
]
