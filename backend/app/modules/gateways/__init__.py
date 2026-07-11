"""
app/modules/gateways

Edge gateway registration, provisioning, and status tracking.
"""

from app.modules.gateways.api.gateway_router import router

__all__ = ["router"]
