"""
app/config/settings.py

Centralised platform configuration loaded from environment variables / .env file.
All settings are validated by Pydantic at startup – a missing required variable or
a type mismatch will raise an error before the server accepts any traffic.

Usage
-----
    from app.config.settings import settings

    print(settings.db_url)
    print(settings.jwt_algorithm)
    print(settings.cors_origins)   # List[str]
"""

from functools import lru_cache
from typing import List

from pydantic import Field, field_validator, computed_field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """
    Single flat settings class.  All variables are read from .env / environment.
    Logical grouping is expressed through naming conventions (prefix_field)
    and @computed_field / @property helpers.

    Example
    -------
        from app.config.settings import settings

        db_url    = settings.db_url
        jwt_algo  = settings.jwt_algorithm
        origins   = settings.cors_origins
    """

    # -----------------------------------------------------------------------
    # Application
    # -----------------------------------------------------------------------
    app_name: str = Field("LocalIoTCloud", alias="APP_NAME")
    app_env: str = Field("development", alias="APP_ENV")
    debug: bool = Field(True, alias="DEBUG")
    secret_key: str = Field(..., alias="SECRET_KEY")
    api_v1_prefix: str = Field("/api/v1", alias="API_V1_PREFIX")

    # -----------------------------------------------------------------------
    # Database – MySQL / MariaDB
    # -----------------------------------------------------------------------
    db_host: str = Field("localhost", alias="DB_HOST")
    db_port: int = Field(3306, alias="DB_PORT")
    db_name: str = Field("localiotcloud", alias="DB_NAME")
    db_user: str = Field(..., alias="DB_USER")
    db_password: str = Field(..., alias="DB_PASSWORD")
    db_echo: bool = Field(False, alias="DB_ECHO")
    db_pool_size: int = Field(10, alias="DB_POOL_SIZE")
    db_max_overflow: int = Field(20, alias="DB_MAX_OVERFLOW")

    # -----------------------------------------------------------------------
    # Time-Series – InfluxDB 2.x
    # -----------------------------------------------------------------------
    influx_url: str = Field("http://localhost:8086", alias="INFLUX_URL")
    influx_token: str = Field(..., alias="INFLUX_TOKEN")
    influx_org: str = Field("localiotcloud", alias="INFLUX_ORG")
    influx_bucket: str = Field("telemetry", alias="INFLUX_BUCKET")
    influx_timeout_ms: int = Field(10_000, alias="INFLUX_TIMEOUT_MS")

    # -----------------------------------------------------------------------
    # Cache / Broker – Redis
    # -----------------------------------------------------------------------
    redis_host: str = Field("localhost", alias="REDIS_HOST")
    redis_port: int = Field(6379, alias="REDIS_PORT")
    redis_password: str = Field("", alias="REDIS_PASSWORD")
    redis_db: int = Field(0, alias="REDIS_DB")
    redis_max_connections: int = Field(20, alias="REDIS_MAX_CONNECTIONS")

    # -----------------------------------------------------------------------
    # Authentication – JWT
    # -----------------------------------------------------------------------
    jwt_secret_key: str = Field(..., alias="JWT_SECRET_KEY")
    jwt_algorithm: str = Field("HS256", alias="JWT_ALGORITHM")
    access_token_expire_minutes: int = Field(30, alias="ACCESS_TOKEN_EXPIRE_MINUTES")
    refresh_token_expire_days: int = Field(7, alias="REFRESH_TOKEN_EXPIRE_DAYS")

    # -----------------------------------------------------------------------
    # Message Broker – MQTT
    # -----------------------------------------------------------------------
    mqtt_host: str = Field("localhost", alias="MQTT_HOST")
    mqtt_port: int = Field(1883, alias="MQTT_PORT")
    mqtt_username: str = Field("", alias="MQTT_USERNAME")
    mqtt_password: str = Field("", alias="MQTT_PASSWORD")
    mqtt_client_id: str = Field("localiotcloud-backend", alias="MQTT_CLIENT_ID")
    mqtt_use_tls: bool = Field(False, alias="MQTT_USE_TLS")
    mqtt_tls_port: int = Field(8883, alias="MQTT_TLS_PORT")
    mqtt_ca_cert: str = Field("", alias="MQTT_CA_CERT")
    mqtt_telemetry_topic: str = Field(
        "iot/{org}/{device}/telemetry", alias="MQTT_TELEMETRY_TOPIC"
    )
    mqtt_command_topic: str = Field(
        "iot/{org}/{device}/command", alias="MQTT_COMMAND_TOPIC"
    )

    # -----------------------------------------------------------------------
    # CORS
    # -----------------------------------------------------------------------
    allowed_origins: str = Field("http://localhost:3000", alias="ALLOWED_ORIGINS")

    # -----------------------------------------------------------------------
    # Logging
    # -----------------------------------------------------------------------
    log_level: str = Field("DEBUG", alias="LOG_LEVEL")
    log_file: str = Field("logs/app.log", alias="LOG_FILE")
    log_rotation: str = Field("10 MB", alias="LOG_ROTATION")
    log_retention: str = Field("30 days", alias="LOG_RETENTION")

    # -----------------------------------------------------------------------
    # Platform
    # -----------------------------------------------------------------------
    platform_max_tenants: int = Field(100, alias="PLATFORM_MAX_TENANTS")
    platform_max_devices: int = Field(10_000, alias="PLATFORM_MAX_DEVICES")
    license_key: str = Field("", alias="LICENSE_KEY")
    license_mode: str = Field("community", alias="LICENSE_MODE")
    telemetry_batch_size: int = Field(500, alias="TELEMETRY_BATCH_SIZE")
    telemetry_flush_interval: int = Field(5, alias="TELEMETRY_FLUSH_INTERVAL")
    default_page_size: int = Field(20, alias="DEFAULT_PAGE_SIZE")
    max_page_size: int = Field(200, alias="MAX_PAGE_SIZE")

    # -----------------------------------------------------------------------
    # Validators
    # -----------------------------------------------------------------------

    @field_validator("log_level")
    @classmethod
    def validate_log_level(cls, v: str) -> str:
        allowed = {"DEBUG", "INFO", "WARNING", "ERROR", "CRITICAL"}
        upper = v.upper()
        if upper not in allowed:
            raise ValueError(f"LOG_LEVEL must be one of {allowed}, got '{v}'")
        return upper

    @field_validator("app_env")
    @classmethod
    def validate_app_env(cls, v: str) -> str:
        allowed = {"development", "staging", "production"}
        if v not in allowed:
            raise ValueError(f"APP_ENV must be one of {allowed}")
        return v

    # -----------------------------------------------------------------------
    # Computed / derived properties
    # -----------------------------------------------------------------------

    @property
    def database_url(self) -> str:
        """Sync SQLAlchemy URL – used by Alembic and sync queries."""
        return (
            f"mysql+pymysql://{self.db_user}:{self.db_password}"
            f"@{self.db_host}:{self.db_port}/{self.db_name}"
        )

    @property
    def db_async_url(self) -> str:
        """Async SQLAlchemy URL – used by the async engine (aiomysql)."""
        return (
            f"mysql+aiomysql://{self.db_user}:{self.db_password}"
            f"@{self.db_host}:{self.db_port}/{self.db_name}"
        )

    @property
    def redis_url(self) -> str:
        if self.redis_password:
            return (
                f"redis://:{self.redis_password}"
                f"@{self.redis_host}:{self.redis_port}/{self.redis_db}"
            )
        return f"redis://{self.redis_host}:{self.redis_port}/{self.redis_db}"

    @property
    def cors_origins(self) -> List[str]:
        return [o.strip() for o in self.allowed_origins.split(",") if o.strip()]

    @property
    def mqtt_effective_port(self) -> int:
        return self.mqtt_tls_port if self.mqtt_use_tls else self.mqtt_port

    @property
    def is_production(self) -> bool:
        return self.app_env == "production"

    @property
    def is_debug(self) -> bool:
        return self.debug and not self.is_production

    # -----------------------------------------------------------------------
    # Pydantic config
    # -----------------------------------------------------------------------

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",           # silently ignore unrecognised env vars
        populate_by_name=True,    # allow both alias and field name
    )


# ---------------------------------------------------------------------------
# Cached singleton
# ---------------------------------------------------------------------------

@lru_cache(maxsize=1)
def get_settings() -> Settings:
    """
    Returns a cached Settings instance (loaded once at startup).
    Call ``get_settings.cache_clear()`` in tests to reset between cases.
    """
    return Settings()


# Module-level alias – import this everywhere:
#   from app.config.settings import settings
settings: Settings = get_settings()
