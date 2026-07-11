"""
app/modules/organizations/constants.py

Constants scoped specifically to the Organizations module.
Platform-wide constants live in app/core/constants.py.
"""

# ---------------------------------------------------------------------------
# Field limits
# ---------------------------------------------------------------------------

ORG_NAME_MAX_LEN: int = 255
ORG_SLUG_MAX_LEN: int = 100
ORG_SLUG_MIN_LEN: int = 2
ORG_DESCRIPTION_MAX_LEN: int = 1000
ORG_CONTACT_EMAIL_MAX_LEN: int = 255
ORG_LOGO_URL_MAX_LEN: int = 500

# ---------------------------------------------------------------------------
# Business rules
# ---------------------------------------------------------------------------

DEFAULT_MAX_DEVICES_PER_ORG: int = 1_000
MAX_DEVICES_PER_ORG_CEILING: int = 100_000    # hard platform cap
DEFAULT_MAX_USERS_PER_ORG: int = 50

# ---------------------------------------------------------------------------
# Slug generation
# ---------------------------------------------------------------------------

# Characters allowed in auto-generated slugs
SLUG_ALLOWED_CHARS: str = "abcdefghijklmnopqrstuvwxyz0123456789-"
SLUG_SEPARATOR: str = "-"

# ---------------------------------------------------------------------------
# Error messages  (keeps service layer DRY)
# ---------------------------------------------------------------------------

ERR_ORG_NOT_FOUND: str = "Organization not found."
ERR_SLUG_TAKEN: str = "An organization with this slug already exists."
ERR_NAME_TAKEN: str = "An organization with this name already exists in the tenant."
ERR_MAX_DEVICES_EXCEEDED: str = (
    "max_devices cannot exceed the platform ceiling of "
    f"{MAX_DEVICES_PER_ORG_CEILING:,}."
)
