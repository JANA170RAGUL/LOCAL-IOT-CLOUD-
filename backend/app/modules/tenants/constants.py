"""
app/modules/tenants/constants.py

Constants scoped to the Tenant module.
Platform-wide constants live in app/core/constants.py.
"""

# ---------------------------------------------------------------------------
# Field limits
# ---------------------------------------------------------------------------

TENANT_NAME_MAX_LEN: int = 255
TENANT_DESCRIPTION_MAX_LEN: int = 1000

# ---------------------------------------------------------------------------
# Error messages
# ---------------------------------------------------------------------------

ERR_TENANT_NOT_FOUND: str = "Tenant not found."
ERR_TENANT_ALREADY_EXISTS: str = "A tenant with this identifier already exists."
