"""
app/modules/tenants/api/tenant_router.py

FastAPI router for the Tenants endpoints.

Mounted at: / (or registered directly in app/main.py)
This router handles hierarchical organization-scoped tenant endpoints
as well as tenant-specific endpoints.

Endpoints
---------
POST   /organizations/{organization_id}/tenants/    Create a new tenant
GET    /organizations/{organization_id}/tenants/    List tenants for an organization
GET    /tenants/{tenant_id}                         Get a single tenant by UUID
PATCH  /tenants/{tenant_id}                         Partially update a tenant (PATCH)
PUT    /tenants/{tenant_id}                         Partially update a tenant (PUT alias)
DELETE /tenants/{tenant_id}                         Soft-delete a tenant
"""

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.core.constants import DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE
from app.database.session import get_db
from app.modules.tenants.dependencies import get_tenant_service
from app.modules.tenants.schemas.tenant import (
    TenantCreate,
    TenantFilter,
    TenantListResponse,
    TenantResponse,
    TenantUpdate,
)
from app.modules.tenants.services.tenant_service import TenantService

from app.core.access_scope import AccessScope, get_access_scope
from app.core.tenant_guard import TenantGuard

router = APIRouter(
    tags=["Tenants"],
)


# ---------------------------------------------------------------------------
# POST /organizations/{organization_id}/tenants/
# ---------------------------------------------------------------------------

@router.post(
    "/organizations/{organization_id}/tenants/",
    response_model=TenantResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create tenant",
    description="Create a new tenant under a specific organization.",
)
def create_tenant(
    organization_id: str,
    payload: TenantCreate,
    db: Session = Depends(get_db),
    svc: TenantService = Depends(get_tenant_service),
    scope: AccessScope = Depends(get_access_scope),
) -> TenantResponse:
    TenantGuard.organization(db, organization_id, scope)
    return svc.create_tenant(db, organization_id, payload)


# ---------------------------------------------------------------------------
# GET /organizations/{organization_id}/tenants/
# ---------------------------------------------------------------------------

@router.get(
    "/organizations/{organization_id}/tenants/",
    response_model=TenantListResponse,
    summary="List tenants",
    description="List all tenants belonging to an organization with optional search and status filtering.",
)
def list_tenants(
    organization_id: str,
    search: str | None = Query(None, description="Keyword search across name, code, and email"),
    tenant_status: str | None = Query(
        None,
        alias="status",
        pattern="^(ACTIVE|INACTIVE|SUSPENDED|TRIAL|EXPIRED)$",
        description="Filter by tenant lifecycle status",
    ),
    page: int = Query(1, ge=1, description="Page number (1-indexed)"),
    page_size: int = Query(DEFAULT_PAGE_SIZE, ge=1, le=MAX_PAGE_SIZE, description="Items per page"),
    db: Session = Depends(get_db),
    svc: TenantService = Depends(get_tenant_service),
    scope: AccessScope = Depends(get_access_scope),
) -> TenantListResponse:
    TenantGuard.organization(db, organization_id, scope)
    filters = TenantFilter(
        search=search,
        status=tenant_status,
        page=page,
        page_size=page_size,
    )
    return svc.list_tenants(db, organization_id, filters, scope=scope)


# ---------------------------------------------------------------------------
# GET /tenants/{tenant_id}
# ---------------------------------------------------------------------------

@router.get(
    "/tenants/{tenant_id}",
    response_model=TenantResponse,
    summary="Get tenant",
    description="Fetch details of a single tenant by UUID.",
)
def get_tenant(
    tenant_id: str,
    db: Session = Depends(get_db),
    svc: TenantService = Depends(get_tenant_service),
    scope: AccessScope = Depends(get_access_scope),
) -> TenantResponse:
    TenantGuard.tenant(db, tenant_id, scope)
    return svc.get_tenant(db, tenant_id)


# ---------------------------------------------------------------------------
# PATCH /tenants/{tenant_id}
# ---------------------------------------------------------------------------

@router.patch(
    "/tenants/{tenant_id}",
    response_model=TenantResponse,
    summary="Partially update tenant (PATCH)",
    description="Partially update a tenant's fields. Only fields provided in the body are modified.",
)
def patch_tenant(
    tenant_id: str,
    payload: TenantUpdate,
    db: Session = Depends(get_db),
    svc: TenantService = Depends(get_tenant_service),
    scope: AccessScope = Depends(get_access_scope),
) -> TenantResponse:
    TenantGuard.tenant(db, tenant_id, scope)
    return svc.update_tenant(db, tenant_id, payload)


# ---------------------------------------------------------------------------
# PUT /tenants/{tenant_id}
# ---------------------------------------------------------------------------

@router.put(
    "/tenants/{tenant_id}",
    response_model=TenantResponse,
    summary="Update tenant (PUT)",
    description="Update a tenant's fields. Works exactly like PATCH (partial update).",
)
def put_tenant(
    tenant_id: str,
    payload: TenantUpdate,
    db: Session = Depends(get_db),
    svc: TenantService = Depends(get_tenant_service),
    scope: AccessScope = Depends(get_access_scope),
) -> TenantResponse:
    TenantGuard.tenant(db, tenant_id, scope)
    return svc.update_tenant(db, tenant_id, payload)


# ---------------------------------------------------------------------------
# DELETE /tenants/{tenant_id}
# ---------------------------------------------------------------------------

@router.delete(
    "/tenants/{tenant_id}",
    summary="Deactivate tenant",
    description="Soft-delete a tenant. Sets is_active=False and status=INACTIVE.",
    status_code=status.HTTP_200_OK,
)
def delete_tenant(
    tenant_id: str,
    db: Session = Depends(get_db),
    svc: TenantService = Depends(get_tenant_service),
    scope: AccessScope = Depends(get_access_scope),
) -> dict:
    TenantGuard.tenant(db, tenant_id, scope)
    return svc.deactivate_tenant(db, tenant_id)
