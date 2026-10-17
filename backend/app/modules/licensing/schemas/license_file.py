"""
app/modules/licensing/schemas/license_file.py

Strict Pydantic schema for vendor-signed .lic files in LocalIoTCloud.
Enforces forbidden extra fields and validates structure prior to RSA verification.
"""

from datetime import datetime
from typing import Any

from pydantic import BaseModel, ConfigDict, Field


class SignedLicenseFile(BaseModel):
    model_config = ConfigDict(
        extra="forbid",
    )

    schema_version: int = 1

    license_id: str = Field(
        min_length=1,
        max_length=100,
    )

    customer: str = Field(
        min_length=1,
        max_length=255,
    )

    plan: str

    issued_at: datetime

    not_before: datetime

    expires_at: datetime

    grace_days: int = Field(
        default=0,
        ge=0,
        le=90,
    )

    machine: str = Field(
        min_length=32,
        max_length=256,
    )

    features: dict[str, Any]

    signature: str
