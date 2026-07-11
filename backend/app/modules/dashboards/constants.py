"""
app/modules/dashboards/constants.py

Constants scoped to the Dashboard module.
Platform-wide constants live in app/core/constants.py.
"""

# ---------------------------------------------------------------------------
# Field limits
# ---------------------------------------------------------------------------

DASHBOARD_NAME_MAX_LEN: int = 255
DASHBOARD_DESCRIPTION_MAX_LEN: int = 1000

# ---------------------------------------------------------------------------
# Error messages
# ---------------------------------------------------------------------------

ERR_DASHBOARD_NOT_FOUND: str = "Dashboard not found."
ERR_DASHBOARD_ALREADY_EXISTS: str = "A dashboard with this identifier already exists."
