"""
app/modules/rules/constants.py

Constants scoped to the Rule module.
Platform-wide constants live in app/core/constants.py.
"""

# ---------------------------------------------------------------------------
# Field limits
# ---------------------------------------------------------------------------

RULE_NAME_MAX_LEN: int = 255
RULE_DESCRIPTION_MAX_LEN: int = 1000

# ---------------------------------------------------------------------------
# Error messages
# ---------------------------------------------------------------------------

ERR_RULE_NOT_FOUND: str = "Rule not found."
ERR_RULE_ALREADY_EXISTS: str = "A rule with this identifier already exists."
