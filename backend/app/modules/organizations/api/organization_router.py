"""
app/modules/organizations/api/organization_router.py

FastAPI router for the Organizations endpoints.

Mounted at:  /organizations  (registered in app/main.py)

Endpoints
---------
POST   /organizations/             Create a new organization
GET    /organizations/             List organizations (paginated + search + filter)
GET    /organizations/{org_id}     Get a single organization by UUID
PUT    /organizations/{org_id}     Update an organization
DELETE /organizations/{org_id}     Soft-delete an organization

Auth note
---------
Until the authentication module is wired (Step 7), routes are open.
In production, tenant context will be extracted from the JWT via
``Depends(get_current_user)``.
"""

from __future__ import annotations

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.core.constants import DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE
from app.database.session import get_db
from app.modules.organizations.dependencies import get_org_service
from app.modules.organizations.schemas.organization import (
    OrganizationCreate,
    OrganizationFilter,
    OrganizationListResponse,
    OrganizationResponse,
    OrganizationUpdate,
)
from app.modules.organizations.services.organization_service import OrganizationService

router = APIRouter(
    prefix="/organizations",
    tags=["Organizations"],
)


# ---------------------------------------------------------------------------
# POST /organizations/
# ---------------------------------------------------------------------------

@router.post(
    "/",
    response_model=OrganizationResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create organization",
    description="Register a new organization on the platform.",
)
def create_organization(
    payload: OrganizationCreate,
    db: Session = Depends(get_db),
    svc: OrganizationService = Depends(get_org_service),
) -> OrganizationResponse:
    return svc.create(db, payload)


# ---------------------------------------------------------------------------
# GET /organizations/
# ---------------------------------------------------------------------------

@router.get(
    "/",
    response_model=OrganizationListResponse,
    summary="List organizations",
    description="Return a paginated list of organizations with optional search and status filter.",
)
def list_organizations(
    search: str | None = Query(None, description="Keyword search across name, code, and email"),
    org_status: str | None = Query(
        None,
        alias="status",
        pattern="^(ACTIVE|INACTIVE|SUSPENDED|TRIAL|EXPIRED)$",
        description="Filter by lifecycle status",
    ),
    page: int = Query(1, ge=1, description="Page number (1-indexed)"),
    page_size: int = Query(DEFAULT_PAGE_SIZE, ge=1, le=MAX_PAGE_SIZE, description="Items per page"),
    db: Session = Depends(get_db),
    svc: OrganizationService = Depends(get_org_service),
) -> OrganizationListResponse:
    filters = OrganizationFilter(
        search=search,
        status=org_status,
        page=page,
        page_size=page_size,
    )
    return svc.list(db, filters)


# ---------------------------------------------------------------------------
# GET /organizations/{org_id}
# ---------------------------------------------------------------------------

@router.get(
    "/{org_id}",
    response_model=OrganizationResponse,
    summary="Get organization",
    description="Fetch a single organization by its UUID.",
)
def get_organization(
    org_id: str,
    db: Session = Depends(get_db),
    svc: OrganizationService = Depends(get_org_service),
) -> OrganizationResponse:
    return svc.get_by_id(db, org_id)


# ---------------------------------------------------------------------------
# PUT /organizations/{org_id}
# ---------------------------------------------------------------------------

@router.put(
    "/{org_id}",
    response_model=OrganizationResponse,
    summary="Update organization",
    description="Partially update an organization. Only fields present in the request body are changed.",
)
def update_organization(
    org_id: str,
    payload: OrganizationUpdate,
    db: Session = Depends(get_db),
    svc: OrganizationService = Depends(get_org_service),
) -> OrganizationResponse:
    return svc.update(db, org_id, payload)


# ---------------------------------------------------------------------------
# DELETE /organizations/{org_id}
# ---------------------------------------------------------------------------

@router.delete(
    "/{org_id}",
    summary="Deactivate organization",
    description=(
        "Soft-delete an organization. "
        "Sets is_active=False and status=INACTIVE. "
        "All data and foreign-key references are preserved."
    ),
    status_code=status.HTTP_200_OK,
)
def delete_organization(
    org_id: str,
    db: Session = Depends(get_db),
    svc: OrganizationService = Depends(get_org_service),
) -> dict:
    return svc.delete(db, org_id)
