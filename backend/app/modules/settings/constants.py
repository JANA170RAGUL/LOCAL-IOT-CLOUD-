"""
app/modules/settings/constants.py

Constants scoped to the Setting module.
Platform-wide constants live in app/core/constants.py.
"""

# ---------------------------------------------------------------------------
# Field limits
# ---------------------------------------------------------------------------

SETTING_NAME_MAX_LEN: int = 255
SETTING_DESCRIPTION_MAX_LEN: int = 1000

# ---------------------------------------------------------------------------
# Error messages
# ---------------------------------------------------------------------------

ERR_SETTING_NOT_FOUND: str = "Setting not found."
ERR_SETTING_ALREADY_EXISTS: str = "A setting with this identifier already exists."
