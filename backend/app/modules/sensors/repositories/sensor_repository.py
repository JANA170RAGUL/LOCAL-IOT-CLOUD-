"""
app/modules/sensors/repositories/sensor_repository.py

All SQL queries for the Sensor module.

No business logic lives here — only clean SQLAlchemy queries.
"""

from sqlalchemy import and_, func, or_, select
from sqlalchemy.orm import Session

from app.modules.sensors.models.sensor import Sensor
from app.shared.repositories.base_repository import BaseRepository


class SensorRepository(BaseRepository[Sensor]):

    def __init__(self):
        super().__init__(Sensor)

    def get_by_id(self, db: Session, obj_id: str) -> Sensor | None:
        """Fetch a sensor by UUID primary key or by code."""
        stmt = select(Sensor).where(
            or_(
                Sensor.id == obj_id,
                Sensor.code == obj_id,
                Sensor.code.ilike(obj_id),
            )
        )
        return db.scalar(stmt)

    # ── Single-row lookups ────────────────────────────────────────────────────

    def get_by_code(
        self,
        db: Session,
        device_id: str,
        code: str,
    ) -> Sensor | None:
        """
        Fetch a sensor by (device_id, code).

        code is unique only within a device, so both columns are required.
        """
        stmt = select(Sensor).where(
            and_(
                Sensor.device_id == device_id,
                Sensor.code == code,
            )
        )
        return db.scalar(stmt)

    # ── Existence checks (cheap COUNT — no row hydration) ────────────────────

    def exists_by_code(
        self,
        db: Session,
        device_id: str,
        code: str,
    ) -> bool:
        """
        Return True if any sensor in this device already uses this code.
        Used by create_sensor() to enforce the composite uniqueness rule.
        """
        stmt = select(func.count()).select_from(Sensor).where(
            and_(
                Sensor.device_id == device_id,
                Sensor.code == code,
            )
        )
        return db.scalar(stmt) > 0

    # ── Filtered + paginated list ─────────────────────────────────────────────

    def list_by_device(
        self,
        db: Session,
        device_id: str,
        keyword: str | None = None,
        status: str | None = None,
        sensor_type: str | None = None,
        page: int = 1,
        page_size: int = 20,
    ) -> tuple[list[Sensor], int]:
        """
        Return a paginated list of sensors belonging to a device.

        keyword     — LIKE search across name and code
        status      — exact match on the status column (e.g. "ACTIVE")
        sensor_type — exact match on the sensor_type column (e.g. "TEMPERATURE")
        """
        stmt = select(Sensor).where(
            Sensor.device_id == device_id
        )

        if keyword:
            pattern = f"%{keyword}%"
            stmt = stmt.where(
                or_(
                    Sensor.name.ilike(pattern),
                    Sensor.code.ilike(pattern),
                )
            )

        if status:
            stmt = stmt.where(Sensor.status == status)

        if sensor_type:
            stmt = stmt.where(Sensor.sensor_type == sensor_type)

        # Count before pagination
        count_stmt = select(func.count()).select_from(stmt.subquery())
        total: int = db.scalar(count_stmt)

        stmt = (
            stmt
            .order_by(Sensor.name)
            .offset((page - 1) * page_size)
            .limit(page_size)
        )
        items = list(db.scalars(stmt).all())

        return items, total

    # ── Soft-delete ───────────────────────────────────────────────────────────

    def deactivate(self, db: Session, sensor: Sensor) -> Sensor:
        """
        Soft-delete: set is_active = False and status = INACTIVE.
        The row is preserved for audit trails and FK integrity.
        Never calls db.delete().
        """
        sensor.is_active = False
        sensor.status = "INACTIVE"
        db.commit()
        db.refresh(sensor)
        return sensor
