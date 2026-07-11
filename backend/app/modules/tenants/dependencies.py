"""
app/modules/tenants/dependencies.py

FastAPI Depends() helpers scoped to the Tenant module.
"""

from __future__ import annotations

from app.modules.tenants.services.tenant_service import TenantService


def get_tenant_service() -> TenantService:
    """Provide a TenantService instance for FastAPI dependency injection."""
    return TenantService()
