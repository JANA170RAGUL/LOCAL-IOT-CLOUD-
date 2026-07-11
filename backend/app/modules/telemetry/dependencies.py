"""
app/modules/telemetry/dependencies.py

FastAPI ``Depends()`` helpers scoped to the Telemetry module.
"""

from __future__ import annotations

# from app.modules.telemetry.services.telemetry_service import TelemetryService  # noqa: E501
# Uncomment the import above once the service class is implemented.


def get_telemetry_service():  # type: ignore[return]
    """
    Provide a ``TelemetryService`` instance.
    Uncomment the body once the service class is implemented.
    """
    # return TelemetryService()
    raise NotImplementedError("TelemetryService is not yet implemented.")
