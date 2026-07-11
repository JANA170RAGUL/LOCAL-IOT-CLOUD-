"""
app/modules/analytics/constants.py

Constants scoped to the Analytics module.
Platform-wide constants live in app/core/constants.py.
"""

# ---------------------------------------------------------------------------
# Field limits
# ---------------------------------------------------------------------------

ANALYTICS_NAME_MAX_LEN: int = 255
ANALYTICS_DESCRIPTION_MAX_LEN: int = 1000

# ---------------------------------------------------------------------------
# Error messages
# ---------------------------------------------------------------------------

ERR_ANALYTICS_NOT_FOUND: str = "Analytics not found."
ERR_ANALYTICS_ALREADY_EXISTS: str = "A analytics with this identifier already exists."
