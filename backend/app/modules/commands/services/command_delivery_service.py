import logging
from datetime import datetime, timedelta, timezone
from typing import Optional
from sqlalchemy.orm import Session

from app.modules.commands.models.command_status import CommandStatus

logger = logging.getLogger(__name__)

RETRY_DELAYS = [2, 5, 15]


def _ensure_utc(dt: Optional[datetime]) -> Optional[datetime]:
    if dt is None:
        return None
    if dt.tzinfo is None:
        return dt.replace(tzinfo=timezone.utc)
    return dt


class CommandDeliveryService:

    def __init__(self, publisher):
        self.publisher = publisher

    def deliver(self, db: Session, command) -> None:
        now = datetime.now(timezone.utc)

        # --------------------------------------------
        # 1. Already in terminal state
        # --------------------------------------------
        if command.status in {
            CommandStatus.EXECUTED.value,
            CommandStatus.FAILED.value,
            CommandStatus.TIMED_OUT.value,
            CommandStatus.CANCELLED.value,
        }:
            return

        # --------------------------------------------
        # 2. Device already acknowledged command.
        #    NEVER republish automatically after ACK.
        # --------------------------------------------
        if command.status == CommandStatus.ACKNOWLEDGED.value:
            return

        # --------------------------------------------
        # 3. Command expired
        # --------------------------------------------
        expires_at_utc = _ensure_utc(command.expires_at)
        if expires_at_utc and expires_at_utc <= now:
            command.status = CommandStatus.TIMED_OUT.value
            command.completed_at = now
            command.last_error = "Command expired before device acknowledgement."
            db.commit()
            return

        # --------------------------------------------
        # 4. Maximum retry attempts exceeded
        # --------------------------------------------
        if command.attempt_count >= command.max_attempts and command.status == CommandStatus.SENT.value:
            command.status = CommandStatus.TIMED_OUT.value
            command.completed_at = now
            command.last_error = "Maximum delivery attempts exceeded."
            db.commit()
            return

        # --------------------------------------------
        # 5. Publish command with QoS 1
        # --------------------------------------------
        try:
            info = self.publisher.publish(command)
            info.wait_for_publish(timeout=5)

            if not info.is_published():
                raise RuntimeError("MQTT broker did not acknowledge publication.")

            command.attempt_count += 1
            command.status = CommandStatus.SENT.value
            command.published_at = now
            command.sent_time = now

            retry_index = min(command.attempt_count - 1, len(RETRY_DELAYS) - 1)
            command.next_retry_at = now + timedelta(seconds=RETRY_DELAYS[retry_index])
            command.last_error = None
            db.commit()

        except Exception as exc:
            command.attempt_count += 1
            command.last_error = str(exc)

            retry_index = min(command.attempt_count - 1, len(RETRY_DELAYS) - 1)
            command.next_retry_at = now + timedelta(seconds=RETRY_DELAYS[retry_index])
            db.commit()

            logger.exception(f"Command {command.id} delivery failed: {exc}")
