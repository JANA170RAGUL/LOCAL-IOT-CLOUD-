"""
app/modules/organizations/dependencies.py

FastAPI ``Depends()`` helpers scoped to the Organizations module.

These dependencies are injected directly into route function signatures,
keeping routes thin and testable.

Example
-------
    from app.modules.organizations.dependencies import (
        get_org_service,
        get_validated_org,
    )

    @router.get("/{org_id}")
    def get_org(
        org: OrganizationResponse = Depends(get_validated_org),
    ):
        return org
"""

from __future__ import annotations

from app.modules.organizations.services.organization_service import OrganizationService

# ---------------------------------------------------------------------------
# Service singleton dependency
# ---------------------------------------------------------------------------

def get_org_service() -> OrganizationService:
    """
    Provide an ``OrganizationService`` instance.

    Instantiated fresh per request (stateless service; safe for concurrent use).
    Swap the body here to inject a mock in tests::

        app.dependency_overrides[get_org_service] = lambda: MockOrgService()
    """
    return OrganizationService()


# ---------------------------------------------------------------------------
# Convenience: resolve + validate an org in one step
# ---------------------------------------------------------------------------
# NOTE: get_validated_org is intentionally left as a factory so that route
# handlers can inject it alongside path parameters:
#
#   @router.get("/{org_id}")
#   def endpoint(
#       org_id: str,
#       tenant_id: str = Depends(get_current_tenant_id),   # from auth module
#       db: Session = Depends(get_db),
#       svc: OrganizationService = Depends(get_org_service),
#   ):
#       org = svc.get(db, org_id, tenant_id)
#       return org
#
# A fully-wired get_validated_org that pulls the current user is added in
# Step 7 (authentication module) once CurrentUser is available.
