"""
app/modules/telemetry/services/processing_engine.py

Processes and normalizes raw telemetry payloads:
- Resolves Device and Sensor models
- Applies sensor calibration formula (if data type is number)
- Enforces boundary limits
- Updates timestamps in MySQL (last_seen, last_reading_at)
"""

import logging
from datetime import datetime, timezone

from sqlalchemy.orm import Session

from app.modules.telemetry.services.sensor_resolver import SensorResolver

logger = logging.getLogger(__name__)


class ProcessingEngine:

    @staticmethod
    def process(
        db: Session,
        raw_payload: dict,
        gateway_ctx: str | None = None,
    ) -> dict:
        """
        Processes and calibrates a raw telemetry payload.

        Returns:
            Normalized telemetry dict ready to write to InfluxDB and WebSockets.
        """
        device_str = raw_payload["device"]
        sensor_code = raw_payload["sensor"]
        raw_value = raw_payload["value"]
        timestamp_str = raw_payload.get("timestamp")

        # 1. Resolve entity models
        device, sensor = SensorResolver.resolve(
            db,
            device_str=device_str,
            sensor_code=sensor_code,
            gateway_str=gateway_ctx,
        )

        # 2. Parse / normalize timestamp
        if timestamp_str:
            try:
                # Expecting ISO-8601 (e.g. 2026-07-12T12:00:01Z)
                # Replace 'Z' with +00:00 for python's fromisoformat
                ts_clean = timestamp_str.replace("Z", "+00:00")
                timestamp = datetime.fromisoformat(ts_clean)
            except ValueError:
                timestamp = datetime.now(timezone.utc)
        else:
            timestamp = datetime.now(timezone.utc)

        # 3. Apply calibration if numerical
        calibrated_value = raw_value
        if sensor.data_type == "number":
            try:
                num_val = float(raw_value)
                calibrated_value = (num_val * sensor.calibration_scale) + sensor.calibration_offset
            except (ValueError, TypeError):
                # Fallback to raw value if conversion fails
                pass

        # 4. Check boundaries (log warning if exceeded)
        if sensor.data_type == "number" and isinstance(calibrated_value, (int, float)):
            if sensor.min_value is not None and calibrated_value < sensor.min_value:
                logger.warning(
                    f"Sensor '{sensor.code}' under Device '{device.name}' value {calibrated_value} "
                    f"is below min boundary {sensor.min_value}"
                )
            if sensor.max_value is not None and calibrated_value > sensor.max_value:
                logger.warning(
                    f"Sensor '{sensor.code}' under Device '{device.name}' value {calibrated_value} "
                    f"is above max boundary {sensor.max_value}"
                )

        # 5. Update last seen / reading times in MySQL
        device.last_seen = timestamp
        sensor.last_reading_at = timestamp
        db.commit()

        return {
            "device_id": device.id,
            "gateway_id": device.gateway_id,
            "sensor_id": sensor.id,
            "sensor_code": sensor.code,
            "sensor_type": sensor.sensor_type,
            "data_type": sensor.data_type,
            "raw_value": raw_value,
            "value": calibrated_value,
            "timestamp": timestamp,
        }
