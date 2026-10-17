from datetime import datetime, timezone

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.modules.devices.models.device_credential import (
    DeviceCredential,
)
from app.modules.devices.repositories.device_credential_repository import (
    DeviceCredentialRepository,
)
from app.modules.devices.schemas.device_credential import (
    DeviceCredentialCreate,
)
from app.modules.devices.security.device_credentials import (
    build_device_key,
    generate_key_id,
    generate_secret,
    hash_device_secret,
)


class DeviceCredentialService:

    def __init__(
        self,
        repository: DeviceCredentialRepository | None = None,
    ):
        self.repository = (
            repository
            or DeviceCredentialRepository()
        )

    def create(
        self,
        db: Session,
        device_id: str,
        payload: DeviceCredentialCreate,
    ) -> tuple[DeviceCredential, str]:

        key_id = generate_key_id()
        secret = generate_secret()

        credential = DeviceCredential(
            device_id=device_id,
            key_id=key_id,
            name=payload.name,
            secret_hash=hash_device_secret(secret),
            expires_at=payload.expires_at,
        )

        credential = self.repository.create(
            db,
            credential,
        )

        raw_key = build_device_key(
            key_id,
            secret,
        )

        return credential, raw_key

    def list_for_device(
        self,
        db: Session,
        device_id: str,
    ) -> list[DeviceCredential]:

        return self.repository.list_for_device(
            db,
            device_id,
        )

    def revoke(
        self,
        db: Session,
        device_id: str,
        credential_id: str,
    ) -> DeviceCredential:

        credential = self.repository.get_by_id(
            db,
            credential_id,
        )

        if (
            not credential
            or credential.device_id != device_id
        ):
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Device credential not found.",
            )

        credential.is_active = False

        credential.revoked_at = datetime.now(
            timezone.utc
        )

        return self.repository.save(
            db,
            credential,
        )

    def rotate(
        self,
        db: Session,
        device_id: str,
        credential_id: str,
    ) -> tuple[DeviceCredential, str]:

        old = self.repository.get_by_id(
            db,
            credential_id,
        )

        if (
            not old
            or old.device_id != device_id
        ):
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Device credential not found.",
            )

        old.is_active = False
        old.revoked_at = datetime.now(
            timezone.utc
        )

        self.repository.save(
            db,
            old,
        )

        payload = DeviceCredentialCreate(
            name=old.name,
            expires_at=old.expires_at,
        )

        return self.create(
            db,
            device_id,
            payload,
        )
