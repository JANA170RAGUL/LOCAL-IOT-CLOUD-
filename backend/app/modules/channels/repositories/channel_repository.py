from typing import List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import select
import secrets

from app.modules.channels.models.channel import Channel, ChannelField, ChannelApiKey, ApiKeyType
from app.modules.channels.schemas.channel import ChannelCreate, ChannelUpdate

class ChannelRepository:
    def __init__(self, db: Session):
        self.db = db

    def _generate_api_key(self) -> str:
        return secrets.token_urlsafe(32)

    def get_by_id(self, channel_id: str) -> Optional[Channel]:
        return self.db.query(Channel).filter(Channel.id == channel_id).first()

    def get_by_owner(self, owner_id: str) -> List[Channel]:
        return self.db.query(Channel).filter(Channel.owner_id == owner_id).all()

    def create(self, owner_id: str, obj_in: ChannelCreate) -> Channel:
        # Create Channel
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

        # Create Fields
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

        # Generate API Keys (1 Read, 1 Write)
        read_key = ChannelApiKey(
            channel_id=db_obj.id,
            key_type=ApiKeyType.READ,
            api_key=f"R_{self._generate_api_key()}"
        )
        write_key = ChannelApiKey(
            channel_id=db_obj.id,
            key_type=ApiKeyType.WRITE,
            api_key=f"W_{self._generate_api_key()}"
        )
        self.db.add(read_key)
        self.db.add(write_key)

        self.db.commit()
        self.db.refresh(db_obj)
        return db_obj

    def update(self, db_obj: Channel, obj_in: ChannelUpdate) -> Channel:
        update_data = obj_in.dict(exclude_unset=True)
        
        # Handle fields separately
        fields_data = update_data.pop("fields", None)

        for field in update_data:
            setattr(db_obj, field, update_data[field])

        if fields_data is not None:
            # Delete old fields
            self.db.query(ChannelField).filter(ChannelField.channel_id == db_obj.id).delete()
            # Add new fields
            for field_in in fields_data:
                db_field = ChannelField(
                    channel_id=db_obj.id,
                    field_key=field_in['field_key'],
                    name=field_in['name'],
                    unit=field_in.get('unit'),
                    data_type=field_in.get('data_type', 'float'),
                    description=field_in.get('description')
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

    def regenerate_api_key(self, channel_id: str, key_type: ApiKeyType) -> ChannelApiKey:
        key_obj = self.db.query(ChannelApiKey).filter(
            ChannelApiKey.channel_id == channel_id,
            ChannelApiKey.key_type == key_type
        ).first()

        prefix = "R_" if key_type == ApiKeyType.READ else "W_"
        new_key = f"{prefix}{self._generate_api_key()}"

        if key_obj:
            key_obj.api_key = new_key
        else:
            key_obj = ChannelApiKey(
                channel_id=channel_id,
                key_type=key_type,
                api_key=new_key
            )
            self.db.add(key_obj)

        self.db.commit()
        self.db.refresh(key_obj)
        return key_obj
