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

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from app.core.constants import DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE
from app.core.auth import get_current_user
from app.database.session import get_db
from app.modules.organizations.dependencies import get_org_service
from app.modules.users.models.user import User
from app.modules.organizations.models.organization import Organization
from app.modules.licensing.dependencies import check_feature_limit
from app.modules.organizations.schemas.organization import (
    OrganizationCreate,
    OrganizationFilter,
    OrganizationListResponse,
    OrganizationResponse,
    OrganizationUpdate,
    OrganizationOnboardRequest
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
    # License limit check
    current_count = db.query(Organization).filter(Organization.is_active == True).count()
    check_feature_limit("organizations", current_count)

    res = svc.create(db, payload)
    return OrganizationResponse.model_validate(res)

@router.post(
    "/onboard",
    response_model=dict,
    status_code=status.HTTP_201_CREATED,
    summary="Onboard Organization",
    description="Full onboarding: creates Org, default Tenant, and Admin user.",
)
def onboard_organization(
    payload: OrganizationOnboardRequest,
    db: Session = Depends(get_db),
    svc: OrganizationService = Depends(get_org_service),
):
    import logging
    from app.core.password import generate_temporary_password, hash_password
    from app.modules.users.models.user import User
    
    # 1 & 2: Create Org and Default Tenant
    org = svc.create(db, payload.org)
    
    # In LocalIoTCloud, the OrganizationService.create might already create a default Tenant.
    # Let's fetch it or create it if missing.
    from app.modules.tenants.models.tenant import Tenant
    tenant = db.query(Tenant).filter(Tenant.organization_id == org.id).first()
    if not tenant:
        tenant = Tenant(organization_id=org.id, name=f"{org.name} - Default", code=f"{org.code}-def")
        db.add(tenant)
        db.commit()
        db.refresh(tenant)
        
    # 3 & 4: Create Admin User with temporary password
    temp_password = generate_temporary_password()
    hashed_pw = hash_password(temp_password)
    
    admin_user = User(
        tenant_id=tenant.id,
        first_name=payload.admin_first_name,
        last_name=payload.admin_last_name,
        email=payload.admin_email,
        password_hash=hashed_pw,
        role="Org Admin",
        status="ACTIVE",
        force_password_change=True,
        is_verified=True # typically an admin created this way doesn't need email verification or does. Assuming True.
    )
    db.add(admin_user)
    db.commit()
    
    # 5. "Send Email"
    logging.info(f"Mock Email: Organization {org.name} created. Admin email: {admin_user.email}, Temp Password: {temp_password}. You must change it on first login.")
    
    return {"message": "Organization onboarded successfully. Check admin email for credentials."}


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
    license_type: str | None = Query(
        None,
        pattern="^(Community|Professional|Enterprise|Academic)$",
        description="Filter by license tier",
    ),
    page: int = Query(1, ge=1, description="Page number (1-indexed)"),
    page_size: int = Query(DEFAULT_PAGE_SIZE, ge=1, le=MAX_PAGE_SIZE, description="Items per page"),
    db: Session = Depends(get_db),
    svc: OrganizationService = Depends(get_org_service),
    current_user: User = Depends(get_current_user),
) -> OrganizationListResponse:
    filters = OrganizationFilter(
        search=search,
        status=org_status,
        license_type=license_type,
        page=page,
        page_size=page_size,
    )
    return svc.list(db, filters, current_user)


# ---------------------------------------------------------------------------
from app.core.access_scope import AccessScope, get_access_scope
from app.core.tenant_guard import TenantGuard

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
    scope: AccessScope = Depends(get_access_scope),
) -> OrganizationResponse:
    TenantGuard.organization(db, org_id, scope)
    res = svc.get_by_id(db, org_id)
    return OrganizationResponse.model_validate(res)


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
    scope: AccessScope = Depends(get_access_scope),
) -> OrganizationResponse:
    TenantGuard.organization(db, org_id, scope)
    res = svc.update(db, org_id, payload)
    return OrganizationResponse.model_validate(res)


from app.core.auth import require_permission

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
    dependencies=[Depends(require_permission("organization:delete"))],
)
def delete_organization(
    org_id: str,
    db: Session = Depends(get_db),
    svc: OrganizationService = Depends(get_org_service),
    scope: AccessScope = Depends(get_access_scope),
) -> dict:
    TenantGuard.organization(db, org_id, scope)
    return svc.delete(db, org_id)
