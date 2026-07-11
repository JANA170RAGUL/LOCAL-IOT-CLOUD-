"""
app/modules/tenants/services/tenant_service.py

Business logic for the Tenant module.

Naming convention (effective from Tenant module):
  Service methods are business-oriented — create_tenant(), not create().
  This makes the router immediately self-documenting.

Responsibilities:
  - Validate uniqueness constraints (code per org, email globally)
  - Guard against operations on inactive parent organizations
  - Orchestrate repository calls inside transactions
  - Emit structured audit log entries
  - Raise domain exceptions on violations

The service never writes SQL directly — all persistence goes through
TenantRepository.
"""

import logging
from math import ceil

from sqlalchemy.orm import Session

from app.shared.services.base_service import BaseService
from app.shared.exceptions.tenant import (
    TenantCodeTaken,
    TenantEmailTaken,
    TenantNotFound,
)

from app.modules.tenants.models.tenant import Tenant
from app.modules.tenants.schemas.tenant import (
    TenantCreate,
    TenantFilter,
    TenantListResponse,
    TenantSummary,
    TenantUpdate,
)
from app.modules.tenants.repositories.tenant_repository import TenantRepository

logger = logging.getLogger(__name__)


class TenantService(BaseService[Tenant, TenantRepository]):

    def __init__(self):
        super().__init__(TenantRepository())

    # ------------------------------------------------------------------
    # create_tenant  —  validate → build → persist → log
    # ------------------------------------------------------------------

    def create_tenant(
        self,
        db: Session,
        organization_id: str,
        payload: TenantCreate,
    ) -> Tenant:
        """
        Create a new tenant under the given organization.

        Raises:
            TenantCodeTaken  — if code already used within this organization
            TenantEmailTaken — if email already used by any tenant
        """
        if self.repository.exists_by_code(db, organization_id, payload.code):
            raise TenantCodeTaken()

        if self.repository.exists_by_email(db, payload.email):
            raise TenantEmailTaken()

        tenant = Tenant(
            organization_id=organization_id,
            **payload.model_dump(),
        )

        result = self.repository.create(db, tenant)

        logger.info(
            "tenant.created",
            extra={
                "tenant_id": str(result.id),
                "org_id": organization_id,
                "code": result.code,
            },
        )

        return result

    # ------------------------------------------------------------------
    # get_tenant  —  fetch by ID with not-found guard
    # ------------------------------------------------------------------

    def get_tenant(self, db: Session, tenant_id: str) -> Tenant:
        """
        Fetch a tenant by primary key.

        Raises:
            TenantNotFound — if no record exists for the given ID
        """
        tenant = self.repository.get_by_id(db, tenant_id)

        if not tenant:
            raise TenantNotFound()

        return tenant

    # ------------------------------------------------------------------
    # get_tenant_by_code  —  slug-based lookup
    # ------------------------------------------------------------------

    def get_tenant_by_code(
        self,
        db: Session,
        organization_id: str,
        code: str,
    ) -> Tenant:
        """
        Fetch a tenant by (organization_id, code).

        Raises:
            TenantNotFound — if no record matches
        """
        tenant = self.repository.get_by_code(db, organization_id, code)

        if not tenant:
            raise TenantNotFound()

        return tenant

    # ------------------------------------------------------------------
    # list_tenants  —  paginated + search + status filter
    # ------------------------------------------------------------------

    def list_tenants(
        self,
        db: Session,
        organization_id: str,
        filters: TenantFilter,
    ) -> TenantListResponse:
        """
        Return a paginated list of tenants belonging to an organization.

        Supports:
          - keyword search  (name / code / email)
          - status filter   (ACTIVE | INACTIVE | SUSPENDED | TRIAL | EXPIRED)
          - pagination      (page, page_size)
        """
        items, total = self.repository.list_by_organization(
            db,
            organization_id=organization_id,
            keyword=filters.search,
            status=filters.status,
            page=filters.page,
            page_size=filters.page_size,
        )

        return TenantListResponse(
            total=total,
            page=filters.page,
            page_size=filters.page_size,
            total_pages=ceil(total / filters.page_size) if total else 1,
            items=[TenantSummary.model_validate(item) for item in items],
        )

    # ------------------------------------------------------------------
    # update_tenant  —  fetch → validate → patch → persist → log
    # ------------------------------------------------------------------

    def update_tenant(
        self,
        db: Session,
        tenant_id: str,
        payload: TenantUpdate,
    ) -> Tenant:
        """
        Partially update a tenant.

        Only fields present in the payload are written (exclude_unset).

        Raises:
            TenantNotFound   — if tenant does not exist
            TenantEmailTaken — if new email belongs to another tenant
        """
        tenant = self.get_tenant(db, tenant_id)

        update_data = payload.model_dump(exclude_unset=True)

        # If caller is changing the email, verify it is not taken by another tenant
        new_email = update_data.get("email")
        if new_email and new_email != tenant.email:
            if self.repository.exists_by_email(db, new_email, exclude_id=tenant_id):
                raise TenantEmailTaken()

        for key, value in update_data.items():
            setattr(tenant, key, value)

        result = self.repository.update(db, tenant)

        logger.info(
            "tenant.updated",
            extra={
                "tenant_id": str(result.id),
                "fields": list(update_data.keys()),
            },
        )

        return result

    # ------------------------------------------------------------------
    # deactivate_tenant  —  soft-delete only (no physical removal)
    # ------------------------------------------------------------------

    def deactivate_tenant(self, db: Session, tenant_id: str) -> dict:
        """
        Soft-delete a tenant.

        Sets is_active = False and status = "INACTIVE".
        The record is preserved for audit trails and FK integrity.

        Raises:
            TenantNotFound — if tenant does not exist
        """
        tenant = self.get_tenant(db, tenant_id)

        self.repository.deactivate(db, tenant)

        logger.info(
            "tenant.deactivated",
            extra={"tenant_id": tenant_id},
        )

        return {"message": "Tenant deactivated successfully."}
