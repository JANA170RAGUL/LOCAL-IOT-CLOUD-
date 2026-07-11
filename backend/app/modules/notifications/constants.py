"""
app/modules/notifications/constants.py

Constants scoped to the Notification module.
Platform-wide constants live in app/core/constants.py.
"""

# ---------------------------------------------------------------------------
# Field limits
# ---------------------------------------------------------------------------

NOTIFICATION_NAME_MAX_LEN: int = 255
NOTIFICATION_DESCRIPTION_MAX_LEN: int = 1000

# ---------------------------------------------------------------------------
# Error messages
# ---------------------------------------------------------------------------

ERR_NOTIFICATION_NOT_FOUND: str = "Notification not found."
ERR_NOTIFICATION_ALREADY_EXISTS: str = "A notification with this identifier already exists."
