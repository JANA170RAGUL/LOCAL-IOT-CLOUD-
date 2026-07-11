"""
app/modules/devices/dependencies.py

FastAPI ``Depends()`` helpers scoped to the Device module.
"""

from __future__ import annotations

# from app.modules.devices.services.device_service import DeviceService  # noqa: E501
# Uncomment the import above once the service class is implemented.


def get_device_service():  # type: ignore[return]
    """
    Provide a ``DeviceService`` instance.
    Uncomment the body once the service class is implemented.
    """
    # return DeviceService()
    raise NotImplementedError("DeviceService is not yet implemented.")
