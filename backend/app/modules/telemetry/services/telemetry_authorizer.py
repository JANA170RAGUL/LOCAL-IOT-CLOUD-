from fastapi import HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.modules.devices.models.device import Device
from app.modules.sensors.models.sensor import Sensor


class TelemetryAuthorizer:

    @staticmethod
    def get_sensor(
        db: Session,
        device: Device,
        sensor_code: str,
    ) -> Sensor:
        """
        Resolve an active sensor belonging specifically
        to the authenticated device.
        """

        normalized_code = sensor_code.strip()

        stmt = select(Sensor).where(
            Sensor.device_id == device.id,
            func.lower(Sensor.code)
            == normalized_code.lower(),
            Sensor.is_active.is_(True),
        )

        sensor = db.scalar(stmt)

        if sensor is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Sensor not found.",
            )

        return sensor
