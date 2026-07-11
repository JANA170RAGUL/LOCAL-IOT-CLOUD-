"""
app/modules/widgets/constants.py

Constants scoped to the Widget module.
Platform-wide constants live in app/core/constants.py.
"""

# ---------------------------------------------------------------------------
# Field limits
# ---------------------------------------------------------------------------

WIDGET_NAME_MAX_LEN: int = 255
WIDGET_DESCRIPTION_MAX_LEN: int = 1000

# ---------------------------------------------------------------------------
# Error messages
# ---------------------------------------------------------------------------

ERR_WIDGET_NOT_FOUND: str = "Widget not found."
ERR_WIDGET_ALREADY_EXISTS: str = "A widget with this identifier already exists."
