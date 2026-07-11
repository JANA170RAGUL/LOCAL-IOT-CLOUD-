"""
app/modules/channels/constants.py

Constants scoped to the Channel module.
Platform-wide constants live in app/core/constants.py.
"""

# ---------------------------------------------------------------------------
# Field limits
# ---------------------------------------------------------------------------

CHANNEL_NAME_MAX_LEN: int = 255
CHANNEL_DESCRIPTION_MAX_LEN: int = 1000

# ---------------------------------------------------------------------------
# Error messages
# ---------------------------------------------------------------------------

ERR_CHANNEL_NOT_FOUND: str = "Channel not found."
ERR_CHANNEL_ALREADY_EXISTS: str = "A channel with this identifier already exists."
