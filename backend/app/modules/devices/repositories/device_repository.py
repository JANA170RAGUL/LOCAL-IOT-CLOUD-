"""
app/modules/devices/repositories/device_repository.py

All SQL queries for the Device module.

No business logic lives here — only clean SQLAlchemy queries.
"""

from sqlalchemy import and_, func, or_, select
from sqlalchemy.orm import Session

from app.modules.devices.models.device import Device
from app.shared.repositories.base_repository import BaseRepository


class DeviceRepository(BaseRepository[Device]):

    def __init__(self):
        super().__init__(Device)

    # ── Single-row lookups ────────────────────────────────────────────────────

    def get_by_code(
        self,
        db: Session,
        gateway_id: str,
        code: str,
    ) -> Device | None:
        """
        Fetch a device by (gateway_id, code).

        code is unique only within a gateway, so both columns are required.
        """
        stmt = select(Device).where(
            and_(
                Device.gateway_id == gateway_id,
                Device.code == code,
            )
        )
        return db.scalar(stmt)

    # ── Existence checks (cheap COUNT — no row hydration) ────────────────────

    def exists_by_code(
        self,
        db: Session,
        gateway_id: str,
        code: str,
    ) -> bool:
        """
        Return True if any device in this gateway already uses this code.
        Used by create_device() to enforce the composite uniqueness rule.
        """
        stmt = select(func.count()).select_from(Device).where(
            and_(
                Device.gateway_id == gateway_id,
                Device.code == code,
            )
        )
        return db.scalar(stmt) > 0

    # ── Filtered + paginated list ─────────────────────────────────────────────

    def list_by_gateway(
        self,
        db: Session,
        gateway_id: str,
        keyword: str | None = None,
        status: str | None = None,
        device_type: str | None = None,
        page: int = 1,
        page_size: int = 20,
    ) -> tuple[list[Device], int]:
        """
        Return a paginated list of devices belonging to a gateway.

        keyword     — LIKE search across name and code
        status      — exact match on the status column (e.g. "ACTIVE")
        device_type — exact match on the device_type column (e.g. "sensor_node")
        """
        stmt = select(Device).where(
            Device.gateway_id == gateway_id
        )

        if keyword:
            pattern = f"%{keyword}%"
            stmt = stmt.where(
                or_(
                    Device.name.ilike(pattern),
                    Device.code.ilike(pattern),
                )
            )

        if status:
            stmt = stmt.where(Device.status == status)

        if device_type:
            stmt = stmt.where(Device.device_type == device_type)

        # Count before pagination
        count_stmt = select(func.count()).select_from(stmt.subquery())
        total: int = db.scalar(count_stmt)

        stmt = (
            stmt
            .order_by(Device.name)
            .offset((page - 1) * page_size)
            .limit(page_size)
        )
        items = list(db.scalars(stmt).all())

        return items, total

    # ── Soft-delete ───────────────────────────────────────────────────────────

    def deactivate(self, db: Session, device: Device) -> Device:
        """
        Soft-delete: set is_active = False and status = INACTIVE.
        The row is preserved for audit trails and FK integrity.
        Never calls db.delete().
        """
        device.is_active = False
        device.status = "INACTIVE"
        db.commit()
        db.refresh(device)
        return device
