from datetime import datetime, timezone
from sqlalchemy import select
from sqlalchemy.orm import Session
from fastapi import HTTPException, status

from app.modules.commands.models.command import DeviceCommand
from app.modules.commands.models.command_status import CommandStatus
from app.modules.commands.repositories.command_repository import CommandRepository
from app.modules.commands.schemas.command import CommandCreate
from app.modules.devices.models.device import Device


from app.modules.licensing.features import LicenseFeature
from app.modules.licensing.policy.models import LicenseOperation
from app.modules.licensing.services.license_policy import license_policy


class CommandService:
    @staticmethod
    def enqueue_command(db: Session, device_id: str, cmd_in: CommandCreate) -> DeviceCommand:
        snapshot = license_policy.get_snapshot(db)
        license_policy.ensure_operation(snapshot, LicenseOperation.COMMAND_ISSUE)
        license_policy.ensure_feature(snapshot, LicenseFeature.REMOTE_COMMANDS)

        # 1. Verify device exists
        device = db.execute(select(Device).where(Device.id == device_id)).scalar_one_or_none()
        if not device:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Device not found",
            )

        # 2. Create command in QUEUED status in DB (Command Worker will handle MQTT delivery)
        command = CommandRepository.create(db, device_id, cmd_in)
        return command

    @staticmethod
    def get_command_history(db: Session, device_id: str, limit: int = 50, skip: int = 0):
        return CommandRepository.get_by_device(db, device_id, limit=limit, skip=skip)

    @staticmethod
    def cancel_command(db: Session, command_id: str) -> DeviceCommand:
        command = CommandRepository.get(db, command_id)
        if not command:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Command not found",
            )

        if command.status != CommandStatus.QUEUED.value:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Only queued commands can be cancelled.",
            )

        now = datetime.now(timezone.utc)
        command.status = CommandStatus.CANCELLED.value
        command.completed_at = now
        db.commit()
        db.refresh(command)
        return command
