"""
app/modules/projects/constants.py

Constants scoped to the Project module.
Platform-wide constants live in app/core/constants.py.
"""

# ---------------------------------------------------------------------------
# Field limits
# ---------------------------------------------------------------------------

PROJECT_NAME_MAX_LEN: int = 255
PROJECT_DESCRIPTION_MAX_LEN: int = 1000

# ---------------------------------------------------------------------------
# Error messages
# ---------------------------------------------------------------------------

ERR_PROJECT_NOT_FOUND: str = "Project not found."
ERR_PROJECT_ALREADY_EXISTS: str = "A project with this identifier already exists."
