"""
app/modules/devices/constants.py

Constants scoped to the Device module.
Platform-wide constants live in app/core/constants.py.
"""

# ---------------------------------------------------------------------------
# Field limits
# ---------------------------------------------------------------------------

DEVICE_NAME_MAX_LEN: int = 255
DEVICE_DESCRIPTION_MAX_LEN: int = 1000

# ---------------------------------------------------------------------------
# Error messages
# ---------------------------------------------------------------------------

ERR_DEVICE_NOT_FOUND: str = "Device not found."
ERR_DEVICE_ALREADY_EXISTS: str = "A device with this identifier already exists."
