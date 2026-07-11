"""
app/shared/iot/units.py

Standardized units of measurement symbols used by sensors.
"""

from enum import Enum


class MeasurementUnit(str, Enum):
    CELSIUS = "°C"
    FAHRENHEIT = "°F"
    PERCENT = "%"
    PH = "pH"
    PPM = "ppm"
    VOLT = "V"
    AMPERE = "A"
    WATT = "W"
    LITERS_PER_MIN = "L/min"
    METERS = "m"
    KILOGRAMS = "kg"
    SECONDS = "s"
    CUSTOM = "custom"
