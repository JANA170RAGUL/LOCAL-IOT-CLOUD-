"""
app/shared/iot/device_types.py

Standardized device hardware classifications for consistent device tracking.
"""

from enum import Enum


class DeviceType(str, Enum):
    ESP32 = "ESP32"
    RASPBERRY_PI = "RASPBERRY_PI"
    PLC = "PLC"
    ARDUINO = "ARDUINO"
    CUSTOM = "CUSTOM"
