"""
app/shared/iot/sensor_types.py

Standardized sensor types for consistent configuration across the platform.
"""

from enum import Enum


class SensorType(str, Enum):
    TEMPERATURE = "TEMPERATURE"
    HUMIDITY = "HUMIDITY"
    PRESSURE = "PRESSURE"
    SOIL_MOISTURE = "SOIL_MOISTURE"
    SOIL_PH = "SOIL_PH"
    NPK = "NPK"
    VOLTAGE = "VOLTAGE"
    CURRENT = "CURRENT"
    POWER = "POWER"
    FLOW = "FLOW"
    LEVEL = "LEVEL"
    GPS = "GPS"
    CUSTOM = "CUSTOM"
