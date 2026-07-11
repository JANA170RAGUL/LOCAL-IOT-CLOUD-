"""
app/core/constants.py

Platform-wide constants, enumerations, and magic strings.

All modules should import from here rather than defining their own literals,
so that a single change propagates everywhere.
"""

from enum import Enum


# ---------------------------------------------------------------------------
# Environment
# ---------------------------------------------------------------------------

class Environment(str, Enum):
    DEVELOPMENT = "development"
    STAGING = "staging"
    PRODUCTION = "production"


# ---------------------------------------------------------------------------
# License
# ---------------------------------------------------------------------------

class LicenseMode(str, Enum):
    COMMUNITY = "community"
    ENTERPRISE = "enterprise"


# ---------------------------------------------------------------------------
# Generic record status
# ---------------------------------------------------------------------------

class RecordStatus(str, Enum):
    ACTIVE = "active"
    INACTIVE = "inactive"
    DELETED = "deleted"
    SUSPENDED = "suspended"


# ---------------------------------------------------------------------------
# Device / Gateway status
# ---------------------------------------------------------------------------

class DeviceStatus(str, Enum):
    ONLINE = "online"
    OFFLINE = "offline"
    PROVISIONING = "provisioning"
    MAINTENANCE = "maintenance"
    DECOMMISSIONED = "decommissioned"


class ConnectionProtocol(str, Enum):
    MQTT = "mqtt"
    HTTP = "http"
    COAP = "coap"
    WEBSOCKET = "websocket"
    MODBUS = "modbus"
    OPC_UA = "opc_ua"


# ---------------------------------------------------------------------------
# Alert / Rule severity
# ---------------------------------------------------------------------------

class Severity(str, Enum):
    INFO = "info"
      # lowest
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"  # highest


class AlertStatus(str, Enum):
    OPEN = "open"
    ACKNOWLEDGED = "acknowledged"
    RESOLVED = "resolved"
    SUPPRESSED = "suppressed"


# ---------------------------------------------------------------------------
# Notification channels
# ---------------------------------------------------------------------------

class NotificationChannel(str, Enum):
    EMAIL = "email"
    SMS = "sms"
    PUSH = "push"
    WEBHOOK = "webhook"
    IN_APP = "in_app"


# ---------------------------------------------------------------------------
# User / Auth
# ---------------------------------------------------------------------------

class UserRole(str, Enum):
    SUPER_ADMIN = "super_admin"    # platform-level (no tenant scope)
    TENANT_ADMIN = "tenant_admin"  # full control within a tenant
    ORG_ADMIN = "org_admin"        # full control within an organisation
    ENGINEER = "engineer"          # read/write devices, rules, dashboards
    VIEWER = "viewer"              # read-only
    API_CLIENT = "api_client"      # machine-to-machine (service accounts)


class TokenType(str, Enum):
    ACCESS = "access"
    REFRESH = "refresh"


# ---------------------------------------------------------------------------
# Telemetry / Data types
# ---------------------------------------------------------------------------

class DataType(str, Enum):
    NUMBER = "number"
    BOOLEAN = "boolean"
    STRING = "string"
    JSON = "json"
    GEO = "geo"


class AggregationFunction(str, Enum):
    MEAN = "mean"
    SUM = "sum"
    MIN = "min"
    MAX = "max"
    COUNT = "count"
    LAST = "last"


# ---------------------------------------------------------------------------
# HTTP / API
# ---------------------------------------------------------------------------

class SortOrder(str, Enum):
    ASC = "asc"
    DESC = "desc"


# Standard HTTP header names used across the platform
class Headers:
    REQUEST_ID = "X-Request-ID"
    TENANT_ID = "X-Tenant-ID"
    API_KEY = "X-API-Key"
    CORRELATION_ID = "X-Correlation-ID"


# ---------------------------------------------------------------------------
# Numeric limits / magic numbers
# ---------------------------------------------------------------------------

# Pagination
DEFAULT_PAGE: int = 1
DEFAULT_PAGE_SIZE: int = 20
MAX_PAGE_SIZE: int = 200

# Token lengths
API_KEY_LENGTH: int = 48          # bytes before base64-encode
ACTIVATION_TOKEN_LENGTH: int = 32

# Password policy
MIN_PASSWORD_LENGTH: int = 8
MAX_PASSWORD_LENGTH: int = 128

# Telemetry
MAX_TELEMETRY_FIELDS: int = 100   # max key-value pairs per data point
TELEMETRY_TTL_DAYS: int = 365     # default InfluxDB retention

# Rate limiting (requests per window)
DEFAULT_RATE_LIMIT: int = 1000
DEFAULT_RATE_LIMIT_WINDOW_SECONDS: int = 60
