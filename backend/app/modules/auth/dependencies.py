"""
app/modules/authentication/dependencies.py

FastAPI ``Depends()`` helpers scoped to the Auth module.
"""

from __future__ import annotations

# from app.modules.authentication.services.authentication_service import AuthService  # noqa: E501
# Uncomment the import above once the service class is implemented.


def get_authentication_service():  # type: ignore[return]
    """
    Provide a ``AuthService`` instance.
    Uncomment the body once the service class is implemented.
    """
    # return AuthService()
    raise NotImplementedError("AuthService is not yet implemented.")
