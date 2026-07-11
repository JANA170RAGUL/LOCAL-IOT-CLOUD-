"""
app/modules/gateways/dependencies.py

FastAPI Depends() helpers scoped to the Gateway module.
"""

from __future__ import annotations

from app.modules.gateways.services.gateway_service import GatewayService


def get_gateway_service() -> GatewayService:
    """Provide a GatewayService instance for FastAPI dependency injection."""
    return GatewayService()
