"""
app/modules/organizations/api/__init__.py

HTTP layer for the Organizations module.

Routes
------
POST   /organizations/          Create a new organization
GET    /organizations/          List organizations (paginated + search + filter)
GET    /organizations/{org_id}  Get a single organization by ID
PUT    /organizations/{org_id}  Update an organization
DELETE /organizations/{org_id}  Soft-delete an organization

All business logic lives in OrganizationService.
Routes are kept thin: parse → delegate → return.
"""

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

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
)
def create_organization(
    payload: OrganizationCreate,
    db: Session = Depends(get_db),
    svc: OrganizationService = Depends(get_org_service),
):
    """Register a new organization on the platform."""
    return svc.create(db, payload)


# ---------------------------------------------------------------------------
# GET /organizations/
# ---------------------------------------------------------------------------

@router.get(
    "/",
    response_model=OrganizationListResponse,
    summary="List organizations",
)
def list_organizations(
    search: str | None = Query(None, description="Keyword search across name, code, email"),
    org_status: str | None = Query(
        None,
        alias="status",
        pattern="^(ACTIVE|INACTIVE|SUSPENDED|TRIAL|EXPIRED)$",
        description="Filter by lifecycle status",
    ),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    svc: OrganizationService = Depends(get_org_service),
):
    """
    Return a paginated list of organizations.

    - **search** — keyword match on name, code, or email
    - **status** — filter by ACTIVE | INACTIVE | SUSPENDED | TRIAL | EXPIRED
    - **page / page_size** — pagination controls
    """
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
    summary="Get organization by ID",
)
def get_organization(
    org_id: str,
    db: Session = Depends(get_db),
    svc: OrganizationService = Depends(get_org_service),
):
    """Fetch a single organization by its UUID."""
    return svc.get_by_id(db, org_id)


# ---------------------------------------------------------------------------
# PUT /organizations/{org_id}
# ---------------------------------------------------------------------------

@router.put(
    "/{org_id}",
    response_model=OrganizationResponse,
    summary="Update organization",
)
def update_organization(
    org_id: str,
    payload: OrganizationUpdate,
    db: Session = Depends(get_db),
    svc: OrganizationService = Depends(get_org_service),
):
    """
    Partially update an organization.
    Only fields included in the request body are modified.
    """
    return svc.update(db, org_id, payload)


# ---------------------------------------------------------------------------
# DELETE /organizations/{org_id}
# ---------------------------------------------------------------------------

@router.delete(
    "/{org_id}",
    summary="Deactivate organization",
    status_code=status.HTTP_200_OK,
)
def delete_organization(
    org_id: str,
    db: Session = Depends(get_db),
    svc: OrganizationService = Depends(get_org_service),
):
    """
    Soft-delete an organization.

    The record is **not** physically removed. Instead:
    - `is_active` is set to `False`
    - `status` is set to `INACTIVE`

    All historical data and foreign-key relationships are preserved.
    """
    return svc.delete(db, org_id)
