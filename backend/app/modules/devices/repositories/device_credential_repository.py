from sqlalchemy import select
from sqlalchemy.orm import Session

from app.modules.devices.models.device_credential import (
    DeviceCredential,
)


class DeviceCredentialRepository:

    def create(
        self,
        db: Session,
        credential: DeviceCredential,
    ) -> DeviceCredential:

        db.add(credential)

        db.commit()
        db.refresh(credential)

        return credential

    def get_by_id(
        self,
        db: Session,
        credential_id: str,
    ) -> DeviceCredential | None:

        return db.get(
            DeviceCredential,
            credential_id,
        )

    def get_by_key_id(
        self,
        db: Session,
        key_id: str,
    ) -> DeviceCredential | None:

        stmt = select(
            DeviceCredential
        ).where(
            DeviceCredential.key_id == key_id,
            DeviceCredential.is_active.is_(True),
        )

        return db.scalar(stmt)

    def list_for_device(
        self,
        db: Session,
        device_id: str,
    ) -> list[DeviceCredential]:

        stmt = (
            select(DeviceCredential)
            .where(
                DeviceCredential.device_id == device_id,
            )
            .order_by(
                DeviceCredential.created_at.desc()
            )
        )

        return list(
            db.scalars(stmt).all()
        )

    def save(
        self,
        db: Session,
        credential: DeviceCredential,
    ) -> DeviceCredential:

        db.add(credential)

        db.commit()
        db.refresh(credential)

        return credential
