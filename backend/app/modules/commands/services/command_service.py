from datetime import datetime, timezone
from sqlalchemy.orm import Session
from sqlalchemy import select
from fastapi import HTTPException, status

from app.modules.commands.repositories.command_repository import CommandRepository
from app.modules.commands.schemas.command import CommandCreate, CommandUpdate
from app.modules.commands.models.command import CommandStatus, DeviceCommand
from app.modules.commands.mqtt.publisher import CommandPublisher
from app.modules.devices.models.device import Device

class CommandService:
    @staticmethod
    def enqueue_command(db: Session, device_id: str, cmd_in: CommandCreate) -> DeviceCommand:
        # Verify device exists
        device = db.execute(select(Device).where(Device.id == device_id)).scalar_one_or_none()
        if not device:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Device not found",
            )
            
        # Create command in DB
        command = CommandRepository.create(db, device_id, cmd_in)
        
        # Publish via MQTT
        payload_data = {
            "command_id": command.id,
            "command_type": command.command_type,
            "payload": command.payload
        }
        
        success = CommandPublisher.publish(device.id, payload_data)
        
        # Update status
        status_update = CommandStatus.SENT if success else CommandStatus.FAILED
        update_schema = CommandUpdate(status=status_update)
        
        if success:
            update_schema.sent_time = datetime.now(timezone.utc)
            
        # We need to manually set sent_time since CommandUpdate doesn't have it natively,
        # wait, let's add sent_time to CommandUpdate or set it on the db_obj directly.
        # Actually I can just update db_obj directly for sent_time
        
        db_obj = CommandRepository.update(db, command, update_schema)
        if success:
            db_obj.sent_time = datetime.now(timezone.utc)
            db.commit()
            db.refresh(db_obj)
            
        return db_obj

    @staticmethod
    def get_command_history(db: Session, device_id: str, limit: int = 50, skip: int = 0):
        return CommandRepository.get_by_device(db, device_id, limit=limit, skip=skip)
        
    @staticmethod
    def handle_command_response(db: Session, command_id: str, response_payload: dict) -> None:
        """Called by the MQTT listener when a response is received"""
        command = CommandRepository.get(db, command_id)
        if not command:
            return
            
        response_status = response_payload.get("status", "Executed")
        
        status_val = CommandStatus.EXECUTED
        if str(response_status).upper() == "FAILED":
            status_val = CommandStatus.FAILED
            
        update_schema = CommandUpdate(
            status=status_val,
            response_time=datetime.now(timezone.utc)
        )
        
        CommandRepository.update(db, command, update_schema)
