"""
app/modules/tenants/dependencies.py

FastAPI ``Depends()`` helpers scoped to the Tenant module.
"""

from __future__ import annotations

# from app.modules.tenants.services.tenant_service import TenantService  # noqa: E501
# Uncomment the import above once the service class is implemented.


def get_tenant_service():  # type: ignore[return]
    """
    Provide a ``TenantService`` instance.
    Uncomment the body once the service class is implemented.
    """
    # return TenantService()
    raise NotImplementedError("TenantService is not yet implemented.")
