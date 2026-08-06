"""
app/modules/telemetry/services/sensor_resolver.py

MySQL resolver to map raw strings in telemetry (e.g. device code, sensor code)
to physical database entities (Device & Sensor models).
"""

import uuid

from sqlalchemy import and_, select
from sqlalchemy.orm import Session

from app.modules.devices.models.device import Device
from app.modules.gateways.models.gateway import Gateway
from app.modules.sensors.models.sensor import Sensor


class SensorResolver:

    @staticmethod
    def is_valid_uuid(val: str) -> bool:
        try:
            uuid.UUID(str(val))
            return True
        except ValueError:
            return False

    @classmethod
    def resolve(
        cls,
        db: Session,
        device_str: str,
        sensor_code: str,
        gateway_str: str | None = None,
    ) -> tuple[Device, Sensor]:
        """
        Resolve Device and Sensor from the database.

        Arguments:
            db           — SQLAlchemy session
            device_str   — Device UUID or device code
            sensor_code  — Sensor code (e.g. "TEMP")
            gateway_str  — Optional Gateway UUID or gateway code

        Raises:
            ValueError if device or sensor cannot be resolved uniquely.
        """
        device: Device | None = None

        # 1. Resolve Device
        if cls.is_valid_uuid(device_str):
            # Look up directly by ID
            stmt = select(Device).where(Device.id == device_str)
            device = db.scalar(stmt)
        else:
            # Look up by code
            if gateway_str:
                if cls.is_valid_uuid(gateway_str):
                    # Gateway resolved by ID
                    stmt = select(Device).where(
                        and_(
                            Device.gateway_id == gateway_str,
                            Device.code == device_str,
                        )
                    )
                    device = db.scalar(stmt)
                else:
                    # Gateway resolved by code
                    # Since gateway code is unique per Project, we must join
                    stmt = (
                        select(Device)
                        .join(Gateway)
                        .where(
                            and_(
                                Gateway.code == gateway_str,
                                Device.code == device_str,
                            )
                        )
                    )
                    device = db.scalar(stmt)
            else:
                # No gateway context provided; search across all devices.
                # If ambiguous (multiple devices with same code), raise error.
                stmt = select(Device).where(Device.code == device_str)
                devices = list(db.scalars(stmt).all())
                if len(devices) == 1:
                    device = devices[0]
                elif len(devices) > 1:
                    raise ValueError(
                        f"Ambiguous device code '{device_str}'. Multiple matches found across gateways. "
                        "Please provide gateway context or use device UUID."
                    )

        if not device:
            raise ValueError(f"Device not found for identifier: '{device_str}'")

        if not device.is_active:
            raise ValueError(f"Device '{device.name}' is inactive.")

        # 2. Resolve Sensor under Device
        sensor_stmt = select(Sensor).where(
            and_(
                Sensor.device_id == device.id,
                Sensor.code == sensor_code,
            )
        )
        sensor = db.scalar(sensor_stmt)

        # Fallback A: Case-insensitive match on code or sensor_type (e.g. "HUMIDITY", "humidity", "HUM")
        if not sensor:
            sensor_stmt = select(Sensor).where(
                and_(
                    Sensor.device_id == device.id,
                    (Sensor.code.ilike(sensor_code) | Sensor.sensor_type.ilike(sensor_code)),
                )
            )
            sensor = db.scalar(sensor_stmt)

        # Fallback B: Auto-register new active sensor if missing so multi-sensor data is never dropped
        if not sensor:
            clean_code = sensor_code.upper().strip()
            unit_val = "%" if "HUM" in clean_code else "°C" if "TEMP" in clean_code else "hPa" if "PRESS" in clean_code else ""
            sensor = Sensor(
                device_id=device.id,
                code=clean_code,
                name=f"{clean_code} Sensor",
                sensor_type=clean_code,
                data_type="number",
                unit=unit_val,
                is_active=True,
            )
            db.add(sensor)
            db.commit()
            db.refresh(sensor)

        if not sensor.is_active:
            raise ValueError(f"Sensor '{sensor.name}' is inactive.")

        return device, sensor
