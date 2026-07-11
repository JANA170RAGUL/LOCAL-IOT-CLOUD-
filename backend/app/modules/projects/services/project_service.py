"""
app/modules/projects/services/project_service.py

Business logic for the Project module.

Naming convention:
  Service methods are business-oriented (e.g. create_project, deactivate_project).

Responsibilities:
  - Validate uniqueness constraints (code per tenant)
  - Orchestrate repository calls inside transactions
  - Emit structured audit log entries
  - Raise domain exceptions on violations
"""

import logging
from math import ceil

from sqlalchemy.orm import Session

from app.shared.services.base_service import BaseService
from app.shared.exceptions.project import (
    ProjectCodeTaken,
    ProjectNotFound,
)

from app.modules.projects.models.project import Project
from app.modules.projects.schemas.project import (
    ProjectCreate,
    ProjectFilter,
    ProjectListResponse,
    ProjectSummary,
    ProjectUpdate,
)
from app.modules.projects.repositories.project_repository import ProjectRepository

logger = logging.getLogger(__name__)


class ProjectService(BaseService[Project, ProjectRepository]):

    def __init__(self):
        super().__init__(ProjectRepository())

    # ------------------------------------------------------------------
    # create_project  —  validate → build → persist → log
    # ------------------------------------------------------------------

    def create_project(
        self,
        db: Session,
        tenant_id: str,
        payload: ProjectCreate,
    ) -> Project:
        """
        Create a new project under the given tenant.

        Raises:
            ProjectCodeTaken — if code already used within this tenant
        """
        if self.repository.exists_by_code(db, tenant_id, payload.code):
            raise ProjectCodeTaken()

        project = Project(
            tenant_id=tenant_id,
            **payload.model_dump(),
        )

        result = self.repository.create(db, project)

        logger.info(
            "project.created",
            extra={
                "project_id": str(result.id),
                "tenant_id": tenant_id,
                "code": result.code,
            },
        )

        return result

    # ------------------------------------------------------------------
    # get_project  —  fetch by ID with not-found guard
    # ------------------------------------------------------------------

    def get_project(self, db: Session, project_id: str) -> Project:
        """
        Fetch a project by primary key.

        Raises:
            ProjectNotFound — if no record exists for the given ID
        """
        project = self.repository.get_by_id(db, project_id)

        if not project:
            raise ProjectNotFound()

        return project

    # ------------------------------------------------------------------
    # get_project_by_code  —  slug-based lookup
    # ------------------------------------------------------------------

    def get_project_by_code(
        self,
        db: Session,
        tenant_id: str,
        code: str,
    ) -> Project:
        """
        Fetch a project by (tenant_id, code).

        Raises:
            ProjectNotFound — if no record matches
        """
        project = self.repository.get_by_code(db, tenant_id, code)

        if not project:
            raise ProjectNotFound()

        return project

    # ------------------------------------------------------------------
    # list_projects  —  paginated + search + status filter
    # ------------------------------------------------------------------

    def list_projects(
        self,
        db: Session,
        tenant_id: str,
        filters: ProjectFilter,
    ) -> ProjectListResponse:
        """
        Return a paginated list of projects belonging to a tenant.

        Supports:
          - keyword search  (name / code)
          - status filter   (ACTIVE | INACTIVE | SUSPENDED | TRIAL | EXPIRED)
          - pagination      (page, page_size)
        """
        items, total = self.repository.list_by_tenant(
            db,
            tenant_id=tenant_id,
            keyword=filters.search,
            status=filters.status,
            page=filters.page,
            page_size=filters.page_size,
        )

        return ProjectListResponse(
            total=total,
            page=filters.page,
            page_size=filters.page_size,
            total_pages=ceil(total / filters.page_size) if total else 1,
            items=[ProjectSummary.model_validate(item) for item in items],
        )

    # ------------------------------------------------------------------
    # update_project  —  fetch → patch → persist → log
    # ------------------------------------------------------------------

    def update_project(
        self,
        db: Session,
        project_id: str,
        payload: ProjectUpdate,
    ) -> Project:
        """
        Partially update a project.

        Only fields present in the payload are written (exclude_unset).

        Raises:
            ProjectNotFound — if project does not exist
        """
        project = self.get_project(db, project_id)

        update_data = payload.model_dump(exclude_unset=True)

        for key, value in update_data.items():
            setattr(project, key, value)

        result = self.repository.update(db, project)

        logger.info(
            "project.updated",
            extra={
                "project_id": str(result.id),
                "fields": list(update_data.keys()),
            },
        )

        return result

    # ------------------------------------------------------------------
    # deactivate_project  —  soft-delete only (no physical removal)
    # ------------------------------------------------------------------

    def deactivate_project(self, db: Session, project_id: str) -> dict:
        """
        Soft-delete a project.

        Sets is_active = False and status = "INACTIVE".
        The record is preserved for audit trails and FK integrity.

        Raises:
            ProjectNotFound — if project does not exist
        """
        project = self.get_project(db, project_id)

        self.repository.deactivate(db, project)

        logger.info(
            "project.deactivated",
            extra={"project_id": project_id},
        )

        return {"message": "Project deactivated successfully."}
