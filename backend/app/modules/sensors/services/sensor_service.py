"""
app/modules/sensors/services/sensor_service.py

Business logic for the Sensor module.

Naming convention:
  Service methods are business-oriented (e.g. create_sensor, deactivate_sensor).

Responsibilities:
  - Validate uniqueness constraints (code per device)
  - Orchestrate repository calls inside transactions
  - Emit structured audit log entries
  - Raise domain exceptions on violations
"""

import logging
from math import ceil

from sqlalchemy.orm import Session

from app.modules.sensors.models.sensor import Sensor
from app.modules.sensors.repositories.sensor_repository import SensorRepository
from app.modules.sensors.schemas.sensor import (
    SensorCreate,
    SensorFilter,
    SensorListResponse,
    SensorSummary,
    SensorUpdate,
)
from app.shared.exceptions.sensor import (
    SensorCodeTaken,
    SensorNotFound,
)
from app.shared.services.base_service import BaseService

logger = logging.getLogger(__name__)


class SensorService(BaseService[Sensor, SensorRepository]):

    def __init__(self):
        super().__init__(SensorRepository())

    # ------------------------------------------------------------------
    # create_sensor  —  validate → build → persist → log
    # ------------------------------------------------------------------

    def create_sensor(
        self,
        db: Session,
        device_id: str,
        payload: SensorCreate,
    ) -> Sensor:
        """
        Create a new sensor under the given device.

        Raises:
            SensorCodeTaken — if code already used within this device
        """
        if self.repository.exists_by_code(db, device_id, payload.code):
            raise SensorCodeTaken()

        sensor = Sensor(
            device_id=device_id,
            **payload.model_dump(),
        )

        result = self.repository.create(db, sensor)

        logger.info(
            "sensor.created",
            extra={
                "sensor_id": str(result.id),
                "device_id": device_id,
                "code": result.code,
            },
        )

        return result

    # ------------------------------------------------------------------
    # get_sensor  —  fetch by ID with not-found guard
    # ------------------------------------------------------------------

    def get_sensor(self, db: Session, sensor_id: str) -> Sensor:
        """
        Fetch a sensor by primary key.

        Raises:
            SensorNotFound — if no record exists for the given ID
        """
        sensor = self.repository.get_by_id(db, sensor_id)

        if not sensor:
            raise SensorNotFound()

        return sensor

    # ------------------------------------------------------------------
    # get_sensor_by_code  —  slug-based lookup
    # ------------------------------------------------------------------

    def get_sensor_by_code(
        self,
        db: Session,
        device_id: str,
        code: str,
    ) -> Sensor:
        """
        Fetch a sensor by (device_id, code).

        Raises:
            SensorNotFound — if no record matches
        """
        sensor = self.repository.get_by_code(db, device_id, code)

        if not sensor:
            raise SensorNotFound()

        return sensor

    # ------------------------------------------------------------------
    # list_sensors  —  paginated + search + status/sensor_type filter
    # ------------------------------------------------------------------

    def list_sensors(
        self,
        db: Session,
        device_id: str,
        filters: SensorFilter,
    ) -> SensorListResponse:
        """
        Return a paginated list of sensors belonging to a device.

        Supports:
          - keyword search  (name / code)
          - status filter   (ACTIVE | INACTIVE | SUSPENDED | TRIAL | EXPIRED)
          - sensor_type     (exact enum match)
          - pagination      (page, page_size)
        """
        items, total = self.repository.list_by_device(
            db,
            device_id=device_id,
            keyword=filters.search,
            status=filters.status,
            sensor_type=filters.sensor_type if filters.sensor_type else None,
            page=filters.page,
            page_size=filters.page_size,
        )

        return SensorListResponse(
            total=total,
            page=filters.page,
            page_size=filters.page_size,
            total_pages=ceil(total / filters.page_size) if total else 1,
            items=[SensorSummary.model_validate(item) for item in items],
        )

    # ------------------------------------------------------------------
    # update_sensor  —  fetch → patch → persist → log
    # ------------------------------------------------------------------

    def update_sensor(
        self,
        db: Session,
        sensor_id: str,
        payload: SensorUpdate,
    ) -> Sensor:
        """
        Partially update a sensor.

        Only fields present in the payload are written (exclude_unset).

        Raises:
            SensorNotFound — if sensor does not exist
        """
        sensor = self.get_sensor(db, sensor_id)

        update_data = payload.model_dump(exclude_unset=True)

        for key, value in update_data.items():
            setattr(sensor, key, value)

        result = self.repository.update(db, sensor)

        logger.info(
            "sensor.updated",
            extra={
                "sensor_id": str(result.id),
                "fields": list(update_data.keys()),
            },
        )

        return result

    # ------------------------------------------------------------------
    # deactivate_sensor  —  soft-delete only (no physical removal)
    # ------------------------------------------------------------------

    def deactivate_sensor(self, db: Session, sensor_id: str) -> dict:
        """
        Soft-delete a sensor.

        Sets is_active = False and status = "INACTIVE".
        The record is preserved for audit trails and FK integrity.

        Raises:
            SensorNotFound — if sensor does not exist
        """
        sensor = self.get_sensor(db, sensor_id)

        self.repository.deactivate(db, sensor)

        logger.info(
            "sensor.deactivated",
            extra={"sensor_id": sensor_id},
        )

        return {"message": "Sensor deactivated successfully."}
