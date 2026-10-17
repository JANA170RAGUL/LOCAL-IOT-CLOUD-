from datetime import datetime, timezone
from typing import List
from sqlalchemy import or_, select
from sqlalchemy.orm import Session

from app.modules.commands.models.command import DeviceCommand, CommandStatus


class CommandDeliveryRepository:

    @staticmethod
    def get_ready_commands(
        db: Session,
        limit: int = 50,
    ) -> List[DeviceCommand]:
        now = datetime.now(timezone.utc)

        stmt = (
            select(DeviceCommand)
            .where(
                DeviceCommand.is_active.is_(True),
                DeviceCommand.status.in_(
                    [
                        CommandStatus.QUEUED.value,
                        CommandStatus.SENT.value,
                    ]
                ),
                or_(
                    DeviceCommand.next_retry_at.is_(None),
                    DeviceCommand.next_retry_at <= now,
                ),
                DeviceCommand.attempt_count < DeviceCommand.max_attempts,
            )
            .order_by(DeviceCommand.created_at.asc())
            .limit(limit)
        )

        return list(db.scalars(stmt).all())
