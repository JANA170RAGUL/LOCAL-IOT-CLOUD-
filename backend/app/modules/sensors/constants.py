"""
app/modules/sensors/constants.py

Constants scoped to the Sensor module.
Platform-wide constants live in app/core/constants.py.
"""

# ---------------------------------------------------------------------------
# Field limits
# ---------------------------------------------------------------------------

SENSOR_NAME_MAX_LEN: int = 255
SENSOR_DESCRIPTION_MAX_LEN: int = 1000

# ---------------------------------------------------------------------------
# Error messages
# ---------------------------------------------------------------------------

ERR_SENSOR_NOT_FOUND: str = "Sensor not found."
ERR_SENSOR_ALREADY_EXISTS: str = "A sensor with this identifier already exists."
