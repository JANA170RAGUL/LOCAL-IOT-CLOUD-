"""
app/modules/gateways/dependencies.py

FastAPI ``Depends()`` helpers scoped to the Gateway module.
"""

from __future__ import annotations

# from app.modules.gateways.services.gateway_service import GatewayService  # noqa: E501
# Uncomment the import above once the service class is implemented.


def get_gateway_service():  # type: ignore[return]
    """
    Provide a ``GatewayService`` instance.
    Uncomment the body once the service class is implemented.
    """
    # return GatewayService()
    raise NotImplementedError("GatewayService is not yet implemented.")
