"""
app/modules/reports/constants.py

Constants scoped to the Report module.
Platform-wide constants live in app/core/constants.py.
"""

# ---------------------------------------------------------------------------
# Field limits
# ---------------------------------------------------------------------------

REPORT_NAME_MAX_LEN: int = 255
REPORT_DESCRIPTION_MAX_LEN: int = 1000

# ---------------------------------------------------------------------------
# Error messages
# ---------------------------------------------------------------------------

ERR_REPORT_NOT_FOUND: str = "Report not found."
ERR_REPORT_ALREADY_EXISTS: str = "A report with this identifier already exists."
