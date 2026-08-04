from typing import List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import select

from app.modules.commands.models.command import DeviceCommand
from app.modules.commands.schemas.command import CommandCreate, CommandUpdate

class CommandRepository:
    @staticmethod
    def get(db: Session, command_id: str) -> Optional[DeviceCommand]:
        return db.execute(
            select(DeviceCommand).where(DeviceCommand.id == command_id)
        ).scalar_one_or_none()

    @staticmethod
    def get_by_device(db: Session, device_id: str, limit: int = 50, skip: int = 0) -> List[DeviceCommand]:
        return list(db.execute(
            select(DeviceCommand)
            .where(DeviceCommand.device_id == device_id)
            .order_by(DeviceCommand.created_at.desc())
            .offset(skip)
            .limit(limit)
        ).scalars().all())

    @staticmethod
    def create(db: Session, device_id: str, obj_in: CommandCreate) -> DeviceCommand:
        db_obj = DeviceCommand(
            device_id=device_id,
            command_type=obj_in.command_type,
            payload=obj_in.payload,
        )
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

    @staticmethod
    def update(db: Session, db_obj: DeviceCommand, obj_in: CommandUpdate) -> DeviceCommand:
        update_data = obj_in.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(db_obj, field, value)
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj
