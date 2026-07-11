"""
app/modules/projects/api/project_router.py

FastAPI router for the Projects endpoints.

Mounted at: /
This router handles hierarchical tenant-scoped project endpoints
as well as project-specific endpoints.

Endpoints
---------
POST   /tenants/{tenant_id}/projects/    Create a new project
GET    /tenants/{tenant_id}/projects/    List projects for a tenant
GET    /projects/{project_id}            Get a single project by UUID
PATCH  /projects/{project_id}            Partially update a project (PATCH)
PUT    /projects/{project_id}            Partially update a project (PUT alias)
DELETE /projects/{project_id}            Soft-delete a project
"""

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.core.constants import DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE
from app.database.session import get_db
from app.modules.projects.dependencies import get_project_service
from app.modules.projects.schemas.project import (
    ProjectCreate,
    ProjectFilter,
    ProjectListResponse,
    ProjectResponse,
    ProjectUpdate,
)
from app.modules.projects.services.project_service import ProjectService

router = APIRouter(
    tags=["Projects"],
)


# ---------------------------------------------------------------------------
# POST /tenants/{tenant_id}/projects/
# ---------------------------------------------------------------------------

@router.post(
    "/tenants/{tenant_id}/projects/",
    response_model=ProjectResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create project",
    description="Create a new project under a specific tenant.",
)
def create_project(
    tenant_id: str,
    payload: ProjectCreate,
    db: Session = Depends(get_db),
    svc: ProjectService = Depends(get_project_service),
) -> ProjectResponse:
    return svc.create_project(db, tenant_id, payload)


# ---------------------------------------------------------------------------
# GET /tenants/{tenant_id}/projects/
# ---------------------------------------------------------------------------

@router.get(
    "/tenants/{tenant_id}/projects/",
    response_model=ProjectListResponse,
    summary="List projects",
    description="List all projects belonging to a tenant with optional search and status filtering.",
)
def list_projects(
    tenant_id: str,
    search: str | None = Query(None, description="Keyword search across name and code"),
    project_status: str | None = Query(
        None,
        alias="status",
        pattern="^(ACTIVE|INACTIVE|SUSPENDED|TRIAL|EXPIRED)$",
        description="Filter by project lifecycle status",
    ),
    page: int = Query(1, ge=1, description="Page number (1-indexed)"),
    page_size: int = Query(DEFAULT_PAGE_SIZE, ge=1, le=MAX_PAGE_SIZE, description="Items per page"),
    db: Session = Depends(get_db),
    svc: ProjectService = Depends(get_project_service),
) -> ProjectListResponse:
    filters = ProjectFilter(
        search=search,
        status=project_status,
        page=page,
        page_size=page_size,
    )
    return svc.list_projects(db, tenant_id, filters)


# ---------------------------------------------------------------------------
# GET /projects/{project_id}
# ---------------------------------------------------------------------------

@router.get(
    "/projects/{project_id}",
    response_model=ProjectResponse,
    summary="Get project",
    description="Fetch details of a single project by UUID.",
)
def get_project(
    project_id: str,
    db: Session = Depends(get_db),
    svc: ProjectService = Depends(get_project_service),
) -> ProjectResponse:
    return svc.get_project(db, project_id)


# ---------------------------------------------------------------------------
# PATCH /projects/{project_id}
# ---------------------------------------------------------------------------

@router.patch(
    "/projects/{project_id}",
    response_model=ProjectResponse,
    summary="Partially update project (PATCH)",
    description="Partially update a project's fields. Only fields provided in the body are modified.",
)
def patch_project(
    project_id: str,
    payload: ProjectUpdate,
    db: Session = Depends(get_db),
    svc: ProjectService = Depends(get_project_service),
) -> ProjectResponse:
    return svc.update_project(db, project_id, payload)


# ---------------------------------------------------------------------------
# PUT /projects/{project_id}
# ---------------------------------------------------------------------------

@router.put(
    "/projects/{project_id}",
    response_model=ProjectResponse,
    summary="Update project (PUT)",
    description="Update a project's fields. Works exactly like PATCH (partial update).",
)
def put_project(
    project_id: str,
    payload: ProjectUpdate,
    db: Session = Depends(get_db),
    svc: ProjectService = Depends(get_project_service),
) -> ProjectResponse:
    return svc.update_project(db, project_id, payload)


# ---------------------------------------------------------------------------
# DELETE /projects/{project_id}
# ---------------------------------------------------------------------------

@router.delete(
    "/projects/{project_id}",
    summary="Deactivate project",
    description="Soft-delete a project. Sets is_active=False and status=INACTIVE.",
    status_code=status.HTTP_200_OK,
)
def delete_project(
    project_id: str,
    db: Session = Depends(get_db),
    svc: ProjectService = Depends(get_project_service),
) -> dict:
    return svc.deactivate_project(db, project_id)
