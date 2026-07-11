"""
app/modules/licensing/constants.py

Constants scoped to the License module.
Platform-wide constants live in app/core/constants.py.
"""

# ---------------------------------------------------------------------------
# Field limits
# ---------------------------------------------------------------------------

LICENSE_NAME_MAX_LEN: int = 255
LICENSE_DESCRIPTION_MAX_LEN: int = 1000

# ---------------------------------------------------------------------------
# Error messages
# ---------------------------------------------------------------------------

ERR_LICENSE_NOT_FOUND: str = "License not found."
ERR_LICENSE_ALREADY_EXISTS: str = "A license with this identifier already exists."
