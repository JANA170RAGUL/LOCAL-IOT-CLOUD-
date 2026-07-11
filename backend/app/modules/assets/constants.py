"""
app/modules/assets/constants.py

Constants scoped to the Asset module.
Platform-wide constants live in app/core/constants.py.
"""

# ---------------------------------------------------------------------------
# Field limits
# ---------------------------------------------------------------------------

ASSET_NAME_MAX_LEN: int = 255
ASSET_DESCRIPTION_MAX_LEN: int = 1000

# ---------------------------------------------------------------------------
# Error messages
# ---------------------------------------------------------------------------

ERR_ASSET_NOT_FOUND: str = "Asset not found."
ERR_ASSET_ALREADY_EXISTS: str = "A asset with this identifier already exists."
