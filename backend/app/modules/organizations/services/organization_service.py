"""
app/modules/organizations/services/organization_service.py

Business logic for the Organizations module.

Responsibilities:
  - Validate uniqueness constraints (code, email)
  - Normalize input data
  - Orchestrate repository calls
  - Emit structured audit log entries
  - Raise domain exceptions on violations

The service never writes SQL directly — all persistence goes through
OrganizationRepository.
"""

import logging
from math import ceil

from sqlalchemy.orm import Session

from app.modules.organizations.models.organization import Organization
from app.modules.organizations.repositories.organization_repository import (
    OrganizationRepository,
)
from app.modules.organizations.schemas.organization import (
    OrganizationCreate,
    OrganizationFilter,
    OrganizationListResponse,
    OrganizationSummary,
    OrganizationUpdate,
)
from app.modules.users.models.user import User
from app.shared.exceptions.organization import (
    OrganizationCodeTaken,
    OrganizationEmailTaken,
    OrganizationNotFound,
)
from app.shared.services.base_service import BaseService

logger = logging.getLogger(__name__)


from app.modules.licensing.features import LicenseFeature
from app.modules.licensing.services.license_policy import license_policy
from app.modules.licensing.services.license_usage import license_usage


class OrganizationService(
    BaseService[
        Organization,
        OrganizationRepository,
    ]
):

    def __init__(self):
        repository = OrganizationRepository()
        super().__init__(repository)

    # ------------------------------------------------------------------
    # Create  —  validate → build → persist → log
    # ------------------------------------------------------------------

    def create(self, db: Session, payload: OrganizationCreate) -> Organization:
        """
        Create a new organization.

        Raises:
            OrganizationCodeTaken  — if code is already registered
            OrganizationEmailTaken — if email is already registered
        """
        snapshot = license_policy.get_snapshot(db)
        current_count = license_usage.count_organizations(db)
        license_policy.ensure_capacity(
            snapshot,
            LicenseFeature.ORGANIZATIONS,
            current_count=current_count,
        )

        if self.repository.exists_by_code(db, payload.code):
            raise OrganizationCodeTaken()

        if self.repository.exists_by_email(db, payload.email):
            raise OrganizationEmailTaken()

        organization = Organization(**payload.model_dump())

        result = self.repository.create(db, organization)

        logger.info(
            "organization.created",
            extra={
                "org_id": str(result.id),
                "code": result.code,
                "email": result.email,
            },
        )

        return result

    # ------------------------------------------------------------------
    # Get by ID  —  with not-found guard
    # ------------------------------------------------------------------

    def get_by_id(self, db: Session, organization_id: str) -> Organization:
        """
        Fetch an organization by primary key.

        Raises:
            OrganizationNotFound — if no record exists for the given ID
        """
        organization = self.repository.get_by_id(db, organization_id)

        if not organization:
            raise OrganizationNotFound()

        return organization

    # ------------------------------------------------------------------
    # Get by code  —  useful for slug-based lookups
    # ------------------------------------------------------------------

    def get_by_code(self, db: Session, code: str) -> Organization:
        """
        Fetch an organization by its unique code.

        Raises:
            OrganizationNotFound — if no record matches the code
        """
        organization = self.repository.get_by_code(db, code)

        if not organization:
            raise OrganizationNotFound()

        return organization

    # ------------------------------------------------------------------
    # List  —  paginated + search + status filter
    # ------------------------------------------------------------------

    def list(
        self,
        db: Session,
        filters: OrganizationFilter,
        current_user: User | None = None,
    ) -> OrganizationListResponse:
        """
        Return a paginated list of organizations.

        Supports:
          - keyword search  (name / code / email)
          - status filter   (ACTIVE | INACTIVE | SUSPENDED | TRIAL | EXPIRED)
          - pagination      (page, page_size)
        """
        allowed_org_ids = None
        if current_user and current_user.role not in ["Super Admin", "Admin"]:
            # Customer roles can only see their own organization
            if current_user.organization_id:
                allowed_org_ids = [current_user.organization_id]
            else:
                # If they don't have an organization assigned, they see nothing
                allowed_org_ids = []

        items, total = self.repository.search(
            db,
            keyword=filters.search,
            status=filters.status,
            license_type=filters.license_type,
            page=filters.page,
            page_size=filters.page_size,
            allowed_org_ids=allowed_org_ids,
        )

        return OrganizationListResponse(
            total=total,
            page=filters.page,
            page_size=filters.page_size,
            total_pages=ceil(total / filters.page_size) if total else 1,
            items=[OrganizationSummary.model_validate(item) for item in items],
        )

    # ------------------------------------------------------------------
    # Update  —  fetch → patch → persist → log
    # ------------------------------------------------------------------

    def update(
        self,
        db: Session,
        organization_id: str,
        payload: OrganizationUpdate,
    ) -> Organization:
        """
        Partially update an organization.

        Only fields present in the payload are written (exclude_unset).

        Raises:
            OrganizationNotFound  — if org does not exist
            OrganizationEmailTaken — if the new email belongs to another org
        """
        organization = self.get_by_id(db, organization_id)

        update_data = payload.model_dump(exclude_unset=True)

        # If caller is changing the email, verify it is not taken by a different org
        new_email = update_data.get("email")
        if new_email and new_email != organization.email:
            if self.repository.exists_by_email(db, new_email):
                raise OrganizationEmailTaken()

        for key, value in update_data.items():
            setattr(organization, key, value)

        result = self.repository.update(db, organization)

        logger.info(
            "organization.updated",
            extra={
                "org_id": str(result.id),
                "fields": list(update_data.keys()),
            },
        )

        return result

    # ------------------------------------------------------------------
    # Delete  —  soft-delete only (no physical removal)
    # ------------------------------------------------------------------

    def delete(self, db: Session, organization_id: str) -> dict:
        """
        Soft-delete an organization.

        Sets is_active = False and status = "INACTIVE".
        The record is preserved for audit trails and FK integrity.

        Raises:
            OrganizationNotFound — if org does not exist
        """
        organization = self.get_by_id(db, organization_id)

        self.repository.deactivate(db, organization)

        logger.info(
            "organization.deactivated",
            extra={"org_id": organization_id},
        )

        return {"message": "Organization deactivated successfully."}
