import logging
from datetime import datetime, timedelta, timezone
from typing import Optional
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.config.settings import settings
from app.modules.commands.models.command import DeviceCommand
from app.modules.commands.models.command_status import CommandStatus
from app.modules.commands.schemas.command import DeviceCommandResponse

logger = logging.getLogger(__name__)


def _ensure_utc(dt: Optional[datetime]) -> Optional[datetime]:
    if dt is None:
        return None
    if dt.tzinfo is None:
        return dt.replace(tzinfo=timezone.utc)
    return dt


class CommandResponseService:

    @staticmethod
    def handle(
        db: Session,
        *,
        device_id: str,
        response: DeviceCommandResponse,
    ) -> bool:
        command = db.get(DeviceCommand, response.command_id)

        if not command:
            logger.warning(f"Unknown command response received: {response.command_id}")
            return False

        # CRITICAL SECURITY RULE: Topic device_id must match command.device_id
        if command.device_id != device_id:
            logger.warning(
                f"Rejected command response for {response.command_id}: "
                f"device mismatch (topic: '{device_id}', expected: '{command.device_id}')"
            )
            return False

        now = datetime.now(timezone.utc)

        status_str = (
            response.status.value
            if hasattr(response.status, "value")
            else str(response.status).upper()
        )

        if status_str == "ACKNOWLEDGED":
            if command.status in {
                CommandStatus.EXECUTED.value,
                CommandStatus.FAILED.value,
            }:
                return True

            command.status = CommandStatus.ACKNOWLEDGED.value
            command.acknowledged_at = now
            command.next_retry_at = None
            command.response_message = response.message

        elif status_str == "EXECUTED":
            command.status = CommandStatus.EXECUTED.value
            command.completed_at = now
            command.response_time = now
            command.next_retry_at = None
            command.response_message = response.message

        elif status_str == "FAILED":
            command.status = CommandStatus.FAILED.value
            command.completed_at = now
            command.response_time = now
            command.next_retry_at = None
            command.response_message = response.message

        else:
            logger.warning(f"Invalid device command status string: {status_str}")
            return False

        db.commit()
        return True


def mark_execution_timeouts(db: Session, timeout_seconds: int = 60) -> int:
    eff_timeout = getattr(settings, "command_execution_timeout_seconds", timeout_seconds)
    now = datetime.now(timezone.utc)
    threshold = now - timedelta(seconds=eff_timeout)

    all_acked = list(
        db.scalars(
            select(DeviceCommand).where(
                DeviceCommand.status == CommandStatus.ACKNOWLEDGED.value,
            )
        ).all()
    )

    timed_out_commands = []
    for command in all_acked:
        ack_utc = _ensure_utc(command.acknowledged_at)
        if ack_utc and ack_utc < threshold:
            timed_out_commands.append(command)

    if not timed_out_commands:
        return 0

    for command in timed_out_commands:
        command.status = CommandStatus.TIMED_OUT.value
        command.completed_at = now
        command.last_error = "Device acknowledged the command but did not return a final result."

    db.commit()
    logger.info(f"Marked {len(timed_out_commands)} acknowledged commands as TIMED_OUT due to execution timeout.")
    return len(timed_out_commands)
