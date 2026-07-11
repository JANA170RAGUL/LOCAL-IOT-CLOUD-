"""
app/shared/iot package.

Unified IoT classifications and enums to prevent magic string scattering.
"""

from app.shared.iot.device_types import DeviceType
from app.shared.iot.sensor_types import SensorType
from app.shared.iot.units import MeasurementUnit

__all__ = [
    "DeviceType",
    "SensorType",
    "MeasurementUnit",
]
