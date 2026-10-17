from datetime import datetime

from pydantic import BaseModel, Field, ConfigDict


class DeviceConnectionCreate(BaseModel):
    connection_type: str = Field(
        default="SSH",
        max_length=30,
    )

    host: str = Field(
        ...,
        min_length=1,
        max_length=255,
    )

    port: int = Field(
        default=22,
        ge=1,
        le=65535,
    )

    username: str = Field(
        ...,
        min_length=1,
        max_length=100,
    )

    authentication_type: str = Field(
        default="SSH_KEY",
        max_length=30,
    )

    credential_ref: str | None = Field(
        default=None,
        max_length=255,
    )

    host_key_verified: bool = False


class DeviceConnectionUpdate(BaseModel):
    connection_type: str | None = Field(
        default=None,
        max_length=30,
    )

    host: str | None = Field(
        default=None,
        min_length=1,
        max_length=255,
    )

    port: int | None = Field(
        default=None,
        ge=1,
        le=65535,
    )

    username: str | None = Field(
        default=None,
        min_length=1,
        max_length=100,
    )

    authentication_type: str | None = Field(
        default=None,
        max_length=30,
    )

    credential_ref: str | None = Field(
        default=None,
        max_length=255,
    )

    host_key_verified: bool | None = None


class DeviceConnectionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    device_id: str
    connection_type: str
    host: str
    port: int
    username: str
    authentication_type: str
    credential_ref: str | None
    host_key_verified: bool

    last_tested_at: datetime | None
    last_test_status: str | None
    last_test_message: str | None

    created_at: datetime
    updated_at: datetime
    is_active: bool


class ConnectionTestResponse(BaseModel):
    success: bool
    status: str
    message: str
    tested_at: datetime