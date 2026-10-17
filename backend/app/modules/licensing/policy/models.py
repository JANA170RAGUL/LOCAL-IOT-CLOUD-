"""
app/modules/licensing/policy/models.py

Licensing policy data models, runtime modes, operations, and snapshot representations.
"""

from __future__ import annotations

from datetime import datetime
from enum import StrEnum
from typing import Any

from pydantic import BaseModel


class LicenseRecordStatus(StrEnum):
    ACTIVE = "ACTIVE"
    REPLACED = "REPLACED"
    REVOKED = "REVOKED"


class LicenseMode(StrEnum):
    VALID = "VALID"
    GRACE = "GRACE"
    RESTRICTED = "RESTRICTED"
    UNLICENSED = "UNLICENSED"
    INVALID = "INVALID"
    CLOCK_ROLLBACK = "CLOCK_ROLLBACK"


class LicenseOperation(StrEnum):
    AUTHENTICATE = "AUTHENTICATE"
    READ = "READ"
    LICENSE_MANAGE = "LICENSE_MANAGE"
    BACKUP = "BACKUP"
    TELEMETRY_INGEST = "TELEMETRY_INGEST"
    RESOURCE_CREATE = "RESOURCE_CREATE"
    RESOURCE_MUTATE = "RESOURCE_MUTATE"
    COMMAND_ISSUE = "COMMAND_ISSUE"
    EXPORT = "EXPORT"
    PREMIUM_FEATURE = "PREMIUM_FEATURE"


ALLOWED_IN_RESTRICTED: set[LicenseOperation] = {
    LicenseOperation.AUTHENTICATE,
    LicenseOperation.READ,
    LicenseOperation.LICENSE_MANAGE,
    LicenseOperation.BACKUP,
    LicenseOperation.TELEMETRY_INGEST,
}


class LicenseSnapshot(BaseModel):
    mode: LicenseMode
    license_id: str | None = None
    plan: str | None = None
    expires_at: datetime | None = None
    grace_ends_at: datetime | None = None
    features: dict[str, Any] = {}
    reason: str | None = None
