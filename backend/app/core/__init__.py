"""app/core package – shared platform infrastructure."""

from app.core.constants import (
    AggregationFunction,
    AlertStatus,
    ConnectionProtocol,
    DataType,
    DeviceStatus,
    Environment,
    Headers,
    LicenseMode,
    NotificationChannel,
    RecordStatus,
    Severity,
    SortOrder,
    TokenType,
    UserRole,
)
from app.core.exceptions import (
    BadRequestError,
    ConflictError,
    DatabaseError,
    ExternalServiceError,
    ForbiddenError,
    InternalError,
    InvalidTokenError,
    NotFoundError,
    PlatformException,
    RateLimitError,
    TenantAccessError,
    UnauthorizedError,
    ValidationError,
    register_exception_handlers,
)
from app.core.logging import get_logger, setup_logging
from app.core.security import (
    create_access_token,
    create_refresh_token,
    decode_access_token,
    decode_refresh_token,
    extract_bearer_token,
    generate_activation_token,
    generate_api_key,
    get_token_subject,
    hash_password,
    verify_password,
)

__all__ = [
    # constants
    "AggregationFunction", "AlertStatus", "ConnectionProtocol", "DataType",
    "DeviceStatus", "Environment", "LicenseMode", "NotificationChannel",
    "RecordStatus", "Severity", "SortOrder", "TokenType", "UserRole", "Headers",
    # exceptions
    "PlatformException", "BadRequestError", "ConflictError", "DatabaseError",
    "ExternalServiceError", "ForbiddenError", "InternalError", "InvalidTokenError",
    "NotFoundError", "RateLimitError", "TenantAccessError", "UnauthorizedError",
    "ValidationError", "register_exception_handlers",
    # logging
    "get_logger", "setup_logging",
    # security
    "create_access_token", "create_refresh_token", "decode_access_token",
    "decode_refresh_token", "extract_bearer_token", "generate_activation_token",
    "generate_api_key", "get_token_subject", "hash_password", "verify_password",
]
