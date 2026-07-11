"""
app/modules/tenants

Tenant lifecycle management (create, update, suspend, delete).
"""

from app.modules.tenants.api.tenant_router import router

__all__ = ["router"]
