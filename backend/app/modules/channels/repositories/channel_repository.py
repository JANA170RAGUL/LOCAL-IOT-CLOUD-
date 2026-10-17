from datetime import datetime, timezone
from typing import List, Optional, Tuple
from sqlalchemy.orm import Session
from sqlalchemy import select

from app.modules.channels.models.channel import Channel, ChannelField, ChannelApiKey, ApiKeyType
from app.modules.channels.schemas.channel import ChannelCreate, ChannelUpdate
from app.modules.channels.security.api_keys import generate_key_id, generate_secret, hash_secret, build_api_key


from app.modules.licensing.features import LicenseFeature
from app.modules.licensing.services.license_policy import license_policy
from app.modules.licensing.services.license_usage import license_usage


class ChannelRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_by_id(self, channel_id: str) -> Optional[Channel]:
        return self.db.query(Channel).filter(Channel.id == channel_id).first()

    def get_by_owner(self, owner_id: str) -> List[Channel]:
        return self.db.query(Channel).filter(Channel.owner_id == owner_id).all()

    def create_api_key(self, channel_id: str, key_type: ApiKeyType, name: str = "Primary") -> Tuple[ChannelApiKey, str]:
        key_id = generate_key_id()
        secret = generate_secret()
        key_hash = hash_secret(secret)

        type_str = key_type.value if hasattr(key_type, "value") else str(key_type)

        raw_key = build_api_key(key_id=key_id, secret=secret, key_type=type_str)

        credential = ChannelApiKey(
            channel_id=channel_id,
            key_id=key_id,
            key_hash=key_hash,
            key_type=key_type,
            name=name,
            is_active=True,
            api_key=raw_key,
        )
        self.db.add(credential)
        self.db.flush()

        return credential, raw_key

    def create(self, owner_id: str, obj_in: ChannelCreate) -> Channel:
        snapshot = license_policy.get_snapshot(self.db)
        current_count = license_usage.count_channels(self.db)
        license_policy.ensure_capacity(
            snapshot,
            LicenseFeature.CHANNELS,
            current_count=current_count,
        )
        db_obj = Channel(
            name=obj_in.name,
            description=obj_in.description,
            project_id=obj_in.project_id,
            visibility=obj_in.visibility,
            owner_id=owner_id,
            metadata_dict=obj_in.metadata_dict
        )
        self.db.add(db_obj)
        self.db.flush()

        if obj_in.fields:
            for field_in in obj_in.fields:
                db_field = ChannelField(
                    channel_id=db_obj.id,
                    field_key=field_in.field_key,
                    name=field_in.name,
                    unit=field_in.unit,
                    data_type=field_in.data_type,
                    description=field_in.description
                )
                self.db.add(db_field)

        # Generate default READ & WRITE API keys
        self.create_api_key(db_obj.id, ApiKeyType.READ, name="Read Key")
        self.create_api_key(db_obj.id, ApiKeyType.WRITE, name="Write Key")

        self.db.commit()
        self.db.refresh(db_obj)
        return db_obj

    def update(self, db_obj: Channel, obj_in: ChannelUpdate) -> Channel:
        update_data = obj_in.model_dump(exclude_unset=True) if hasattr(obj_in, "model_dump") else obj_in.dict(exclude_unset=True)
        fields_data = update_data.pop("fields", None)

        for field in update_data:
            setattr(db_obj, field, update_data[field])

        if fields_data is not None:
            self.db.query(ChannelField).filter(ChannelField.channel_id == db_obj.id).delete()
            for field_in in fields_data:
                field_dict = field_in.model_dump() if hasattr(field_in, "model_dump") else field_in
                db_field = ChannelField(
                    channel_id=db_obj.id,
                    field_key=field_dict['field_key'],
                    name=field_dict['name'],
                    unit=field_dict.get('unit'),
                    data_type=field_dict.get('data_type', 'float'),
                    description=field_dict.get('description')
                )
                self.db.add(db_field)

        self.db.commit()
        self.db.refresh(db_obj)
        return db_obj

    def delete(self, channel_id: str) -> None:
        obj = self.get_by_id(channel_id)
        if obj:
            self.db.delete(obj)
            self.db.commit()

    def rotate_api_key(self, channel_id: str, key_id: str) -> Tuple[ChannelApiKey, str]:
        old_key = self.db.query(ChannelApiKey).filter(
            ChannelApiKey.channel_id == channel_id,
            ChannelApiKey.key_id == key_id,
            ChannelApiKey.is_active.is_(True)
        ).first()

        key_type = old_key.key_type if old_key else ApiKeyType.WRITE
        name = old_key.name if old_key else "Primary"

        if old_key:
            old_key.is_active = False
            old_key.revoked_at = datetime.now(timezone.utc)

        new_key_obj, raw_key = self.create_api_key(channel_id, key_type, name=f"{name} (Rotated)")
        self.db.commit()
        self.db.refresh(new_key_obj)
        return new_key_obj, raw_key

    def regenerate_api_key(self, channel_id: str, key_type: ApiKeyType) -> Tuple[ChannelApiKey, str]:
        old_key = self.db.query(ChannelApiKey).filter(
            ChannelApiKey.channel_id == channel_id,
            ChannelApiKey.key_type == key_type,
            ChannelApiKey.is_active.is_(True)
        ).first()

        if old_key:
            old_key.is_active = False
            old_key.revoked_at = datetime.now(timezone.utc)

        type_name = "Read Key" if key_type == ApiKeyType.READ else "Write Key"
        new_key_obj, raw_key = self.create_api_key(channel_id, key_type, name=type_name)
        self.db.commit()
        self.db.refresh(new_key_obj)
        return new_key_obj, raw_key
