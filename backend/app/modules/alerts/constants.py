"""
app/modules/alerts/constants.py

Constants scoped to the Alert module.
Platform-wide constants live in app/core/constants.py.
"""

# ---------------------------------------------------------------------------
# Field limits
# ---------------------------------------------------------------------------

ALERT_NAME_MAX_LEN: int = 255
ALERT_DESCRIPTION_MAX_LEN: int = 1000

# ---------------------------------------------------------------------------
# Error messages
# ---------------------------------------------------------------------------

ERR_ALERT_NOT_FOUND: str = "Alert not found."
ERR_ALERT_ALREADY_EXISTS: str = "A alert with this identifier already exists."
