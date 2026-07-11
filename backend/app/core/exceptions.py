"""
app/core/exceptions.py

Centralised exception hierarchy for the LocalIoTCloud platform.

Design
------
- ``PlatformException`` is the root of all custom exceptions.
- Every subclass maps to an HTTP status code via its ``status_code`` attribute.
- ``register_exception_handlers(app)`` wires them all into FastAPI so handlers
  don't need to import HTTPException directly.

Usage in a service
------------------
    from app.core.exceptions import NotFoundError

    def get_device(device_id: str) -> Device:
        device = repo.find(device_id)
        if not device:
            raise NotFoundError("Device", device_id)

Usage in a route (no try/except needed – handlers do it automatically)
-----------------------------------------------------------------------
    @router.get("/devices/{device_id}")
    def get_device(device_id: str, db: Session = Depends(get_db)):
        return device_service.get_device(device_id, db)
"""

from __future__ import annotations

from typing import Any

from fastapi import FastAPI, Request, status
from fastapi.responses import JSONResponse


# ---------------------------------------------------------------------------
# Base exception
# ---------------------------------------------------------------------------

class PlatformException(Exception):
    """Root exception for all LocalIoTCloud errors."""

    status_code: int = status.HTTP_500_INTERNAL_SERVER_ERROR
    error_code: str = "PLATFORM_ERROR"

    def __init__(
        self,
        message: str = "An unexpected error occurred.",
        detail: Any = None,
        error_code: str | None = None,
    ) -> None:
        self.message = message
        self.detail = detail
        if error_code:
            self.error_code = error_code
        super().__init__(message)

    def to_dict(self) -> dict:
        payload: dict = {
            "error": self.error_code,
            "message": self.message,
        }
        if self.detail is not None:
            payload["detail"] = self.detail
        return payload


# ---------------------------------------------------------------------------
# 400 Bad Request
# ---------------------------------------------------------------------------

class BadRequestError(PlatformException):
    """Malformed request, invalid input, or business rule violation."""
    status_code = status.HTTP_400_BAD_REQUEST
    error_code = "BAD_REQUEST"

    def __init__(self, message: str = "Bad request.", detail: Any = None) -> None:
        super().__init__(message=message, detail=detail)


# ---------------------------------------------------------------------------
# 401 Unauthorized
# ---------------------------------------------------------------------------

class UnauthorizedError(PlatformException):
    """Missing or invalid authentication credentials."""
    status_code = status.HTTP_401_UNAUTHORIZED
    error_code = "UNAUTHORIZED"

    def __init__(self, message: str = "Authentication required.") -> None:
        super().__init__(message=message)


class InvalidTokenError(UnauthorizedError):
    """JWT is expired, malformed, or has been revoked."""
    error_code = "INVALID_TOKEN"

    def __init__(self, message: str = "Token is invalid or expired.") -> None:
        super().__init__(message=message)


# ---------------------------------------------------------------------------
# 403 Forbidden
# ---------------------------------------------------------------------------

class ForbiddenError(PlatformException):
    """Authenticated user lacks permission for the requested action."""
    status_code = status.HTTP_403_FORBIDDEN
    error_code = "FORBIDDEN"

    def __init__(
        self,
        message: str = "You do not have permission to perform this action.",
    ) -> None:
        super().__init__(message=message)


class TenantAccessError(ForbiddenError):
    """Attempt to access a resource belonging to a different tenant."""
    error_code = "TENANT_ACCESS_DENIED"

    def __init__(self, tenant_id: str | None = None) -> None:
        detail = f"tenant_id={tenant_id}" if tenant_id else None
        super().__init__(message="Cross-tenant access is not permitted.")
        self.detail = detail


# ---------------------------------------------------------------------------
# 404 Not Found
# ---------------------------------------------------------------------------

class NotFoundError(PlatformException):
    """Requested resource does not exist."""
    status_code = status.HTTP_404_NOT_FOUND
    error_code = "NOT_FOUND"

    def __init__(
        self,
        resource: str = "Resource",
        identifier: Any = None,
    ) -> None:
        detail = str(identifier) if identifier is not None else None
        super().__init__(
            message=f"{resource} not found.",
            detail=detail,
        )


# ---------------------------------------------------------------------------
# 409 Conflict
# ---------------------------------------------------------------------------

class ConflictError(PlatformException):
    """Resource already exists or a uniqueness constraint was violated."""
    status_code = status.HTTP_409_CONFLICT
    error_code = "CONFLICT"

    def __init__(
        self,
        resource: str = "Resource",
        field: str | None = None,
        value: Any = None,
    ) -> None:
        detail = f"{field}={value}" if field else None
        super().__init__(
            message=f"{resource} already exists.",
            detail=detail,
        )


# ---------------------------------------------------------------------------
# 422 Unprocessable Entity (business logic / semantic validation)
# ---------------------------------------------------------------------------

class ValidationError(PlatformException):
    """Input is syntactically valid but semantically incorrect."""
    status_code = status.HTTP_422_UNPROCESSABLE_CONTENT
    error_code = "VALIDATION_ERROR"

    def __init__(self, message: str, detail: Any = None) -> None:
        super().__init__(message=message, detail=detail)


# ---------------------------------------------------------------------------
# 429 Too Many Requests
# ---------------------------------------------------------------------------

class RateLimitError(PlatformException):
    """Client has exceeded the allowed request rate."""
    status_code = status.HTTP_429_TOO_MANY_REQUESTS
    error_code = "RATE_LIMIT_EXCEEDED"

    def __init__(self, message: str = "Too many requests. Please slow down.") -> None:
        super().__init__(message=message)


# ---------------------------------------------------------------------------
# 500 Internal Server Error
# ---------------------------------------------------------------------------

class InternalError(PlatformException):
    """Unrecoverable server-side error."""
    status_code = status.HTTP_500_INTERNAL_SERVER_ERROR
    error_code = "INTERNAL_ERROR"

    def __init__(self, message: str = "An internal error occurred.") -> None:
        super().__init__(message=message)


class DatabaseError(InternalError):
    """Database operation failed."""
    error_code = "DATABASE_ERROR"

    def __init__(self, message: str = "A database error occurred.") -> None:
        super().__init__(message=message)


class ExternalServiceError(InternalError):
    """Downstream service (InfluxDB, MQTT broker, etc.) is unreachable."""
    error_code = "EXTERNAL_SERVICE_ERROR"

    def __init__(self, service: str, message: str | None = None) -> None:
        super().__init__(
            message=message or f"External service '{service}' is unavailable."
        )


# ---------------------------------------------------------------------------
# FastAPI exception handler registration
# ---------------------------------------------------------------------------

def register_exception_handlers(app: FastAPI) -> None:
    """
    Register all ``PlatformException`` subclasses as FastAPI exception handlers.
    Call this once in ``app/main.py`` during application setup.

    Example
    -------
        from app.core.exceptions import register_exception_handlers
        register_exception_handlers(app)
    """

    @app.exception_handler(PlatformException)
    async def platform_exception_handler(
        request: Request, exc: PlatformException
    ) -> JSONResponse:
        return JSONResponse(
            status_code=exc.status_code,
            content=exc.to_dict(),
        )

    # Also handle Python's built-in ValueError as a 400
    @app.exception_handler(ValueError)
    async def value_error_handler(
        request: Request, exc: ValueError
    ) -> JSONResponse:
        return JSONResponse(
            status_code=status.HTTP_400_BAD_REQUEST,
            content={"error": "BAD_REQUEST", "message": str(exc)},
        )
