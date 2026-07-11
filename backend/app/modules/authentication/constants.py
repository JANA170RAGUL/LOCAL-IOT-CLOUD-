"""
app/modules/authentication/constants.py

Constants scoped to the Auth module.
Platform-wide constants live in app/core/constants.py.
"""

# ---------------------------------------------------------------------------
# Field limits
# ---------------------------------------------------------------------------

AUTH_NAME_MAX_LEN: int = 255
AUTH_DESCRIPTION_MAX_LEN: int = 1000

# ---------------------------------------------------------------------------
# Error messages
# ---------------------------------------------------------------------------

ERR_AUTH_NOT_FOUND: str = "Auth not found."
ERR_AUTH_ALREADY_EXISTS: str = "A auth with this identifier already exists."
