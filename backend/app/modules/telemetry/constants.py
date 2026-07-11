"""
app/modules/telemetry/constants.py

Constants scoped to the Telemetry module.
Platform-wide constants live in app/core/constants.py.
"""

# ---------------------------------------------------------------------------
# Field limits
# ---------------------------------------------------------------------------

TELEMETRY_NAME_MAX_LEN: int = 255
TELEMETRY_DESCRIPTION_MAX_LEN: int = 1000

# ---------------------------------------------------------------------------
# Error messages
# ---------------------------------------------------------------------------

ERR_TELEMETRY_NOT_FOUND: str = "Telemetry not found."
ERR_TELEMETRY_ALREADY_EXISTS: str = "A telemetry with this identifier already exists."
