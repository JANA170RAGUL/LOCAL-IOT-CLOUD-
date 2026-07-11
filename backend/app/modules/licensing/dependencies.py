"""
app/modules/licensing/dependencies.py

FastAPI ``Depends()`` helpers scoped to the License module.
"""

from __future__ import annotations

# from app.modules.licensing.services.licensing_service import LicenseService  # noqa: E501
# Uncomment the import above once the service class is implemented.


def get_licensing_service():  # type: ignore[return]
    """
    Provide a ``LicenseService`` instance.
    Uncomment the body once the service class is implemented.
    """
    # return LicenseService()
    raise NotImplementedError("LicenseService is not yet implemented.")
