"""
app/modules/projects/dependencies.py

FastAPI ``Depends()`` helpers scoped to the Project module.
"""

from __future__ import annotations

# from app.modules.projects.services.project_service import ProjectService  # noqa: E501
# Uncomment the import above once the service class is implemented.


def get_project_service():  # type: ignore[return]
    """
    Provide a ``ProjectService`` instance.
    Uncomment the body once the service class is implemented.
    """
    # return ProjectService()
    raise NotImplementedError("ProjectService is not yet implemented.")
