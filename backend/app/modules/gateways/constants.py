"""
app/modules/gateways/constants.py

Constants scoped to the Gateway module.
Platform-wide constants live in app/core/constants.py.
"""

# ---------------------------------------------------------------------------
# Field limits
# ---------------------------------------------------------------------------

GATEWAY_NAME_MAX_LEN: int = 255
GATEWAY_DESCRIPTION_MAX_LEN: int = 1000

# ---------------------------------------------------------------------------
# Error messages
# ---------------------------------------------------------------------------

ERR_GATEWAY_NOT_FOUND: str = "Gateway not found."
ERR_GATEWAY_ALREADY_EXISTS: str = "A gateway with this identifier already exists."
