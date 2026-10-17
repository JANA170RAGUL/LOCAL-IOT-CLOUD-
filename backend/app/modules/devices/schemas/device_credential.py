from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class DeviceCredentialCreate(BaseModel):
    name: str = Field(
        default="Primary",
        min_length=1,
        max_length=100,
    )

    expires_at: datetime | None = None


class DeviceCredentialRead(BaseModel):
    model_config = ConfigDict(
        from_attributes=True,
    )

    id: str
    device_id: str
    key_id: str
    name: str

    is_active: bool

    expires_at: datetime | None
    last_used_at: datetime | None
    revoked_at: datetime | None

    created_at: datetime


class DeviceCredentialCreated(
    DeviceCredentialRead
):
    """
    api_key exists ONLY in the create/rotate response.

    It must never appear in normal GET responses.
    """

    api_key: str
