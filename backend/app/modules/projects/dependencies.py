"""
app/modules/projects/dependencies.py

FastAPI Depends() helpers scoped to the Project module.
"""

from __future__ import annotations

from app.modules.projects.services.project_service import ProjectService


def get_project_service() -> ProjectService:
    """Provide a ProjectService instance for FastAPI dependency injection."""
    return ProjectService()
