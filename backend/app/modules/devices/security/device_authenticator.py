from datetime import datetime, timedelta, timezone

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.modules.devices.models.device import Device
from app.modules.devices.repositories.device_credential_repository import (
    DeviceCredentialRepository,
)
from app.modules.devices.security.device_credentials import (
    parse_device_key,
    verify_device_secret,
)


INVALID_DEVICE_CREDENTIAL = HTTPException(
    status_code=status.HTTP_401_UNAUTHORIZED,
    detail="Invalid device credentials.",
)


class DeviceAuthenticator:

    def __init__(
        self,
        repository: DeviceCredentialRepository | None = None,
    ):
        self.repository = (
            repository
            or DeviceCredentialRepository()
        )

    def authenticate(
        self,
        db: Session,
        raw_api_key: str,
    ) -> Device:

        try:
            key_id, secret = parse_device_key(
                raw_api_key
            )
        except ValueError:
            raise INVALID_DEVICE_CREDENTIAL

        credential = self.repository.get_by_key_id(
            db,
            key_id,
        )

        if credential is None:
            raise INVALID_DEVICE_CREDENTIAL

        if credential.revoked_at is not None:
            raise INVALID_DEVICE_CREDENTIAL

        now = datetime.now(timezone.utc)

        if credential.expires_at is not None:
            expires = credential.expires_at
            if expires.tzinfo is None:
                expires = expires.replace(tzinfo=timezone.utc)
            if expires <= now:
                raise INVALID_DEVICE_CREDENTIAL

        if not verify_device_secret(
            secret,
            credential.secret_hash,
        ):
            raise INVALID_DEVICE_CREDENTIAL

        device = credential.device

        if device is None:
            raise INVALID_DEVICE_CREDENTIAL

        if not device.is_active:
            raise INVALID_DEVICE_CREDENTIAL

        # Throttle updating last_used_at to at most once every 5 minutes
        # to prevent heavy database write amplification on high-frequency telemetry.
        last_used = credential.last_used_at
        if last_used is not None and last_used.tzinfo is None:
            last_used = last_used.replace(tzinfo=timezone.utc)

        should_update_last_used = (
            last_used is None
            or last_used < now - timedelta(minutes=5)
        )

        if should_update_last_used:
            credential.last_used_at = now
            self.repository.save(
                db,
                credential,
            )

        return device
