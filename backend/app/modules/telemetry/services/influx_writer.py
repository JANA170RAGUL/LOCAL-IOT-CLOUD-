"""
app/modules/telemetry/services/influx_writer.py

InfluxDB time-series storage writer.
"""

import logging

from influxdb_client import Point

from app.config.settings import settings
from app.database.influx import write_api

logger = logging.getLogger(__name__)


class InfluxWriter:

    @staticmethod
    def write_point(processed_data: dict) -> None:
        """Write a single processed telemetry point to InfluxDB."""
        try:
            point = (
                Point("telemetry")
                .tag("device_id", processed_data["device_id"])
                .tag("gateway_id", processed_data["gateway_id"])
                .tag("sensor_code", processed_data["sensor_code"])
                .tag("sensor_type", processed_data["sensor_type"])
                .time(processed_data["timestamp"])
            )

            # Assign field values based on type
            val = processed_data["value"]
            raw = processed_data["raw_value"]

            if isinstance(val, (int, float)):
                point.field("value", float(val))
            elif isinstance(val, bool):
                point.field("value", bool(val))
            else:
                point.field("value", str(val))

            if isinstance(raw, (int, float)):
                point.field("raw_value", float(raw))
            elif isinstance(raw, bool):
                point.field("raw_value", bool(raw))
            else:
                point.field("raw_value", str(raw))

            write_api.write(bucket=settings.influx_bucket, record=point)
        except Exception as e:
            logger.error(f"Failed to write telemetry to InfluxDB: {e}", exc_info=True)

    @staticmethod
    def write_batch(processed_records: list[dict]) -> None:
        """Write a batch of processed telemetry points to InfluxDB in one roundtrip."""
        if not processed_records:
            return

        points = []
        for rec in processed_records:
            try:
                point = (
                    Point("telemetry")
                    .tag("device_id", rec["device_id"])
                    .tag("gateway_id", rec["gateway_id"])
                    .tag("sensor_code", rec["sensor_code"])
                    .tag("sensor_type", rec["sensor_type"])
                    .time(rec["timestamp"])
                )

                val = rec["value"]
                raw = rec["raw_value"]

                if isinstance(val, (int, float)):
                    point.field("value", float(val))
                elif isinstance(val, bool):
                    point.field("value", bool(val))
                else:
                    point.field("value", str(val))

                if isinstance(raw, (int, float)):
                    point.field("raw_value", float(raw))
                elif isinstance(raw, bool):
                    point.field("raw_value", bool(raw))
                else:
                    point.field("raw_value", str(raw))

                points.append(point)
            except Exception as e:
                logger.error(f"Failed parsing point for batch: {e}")

        if points:
            try:
                write_api.write(bucket=settings.influx_bucket, record=points)
            except Exception as e:
                from influxdb_client.rest import ApiException
                if isinstance(e, ApiException) and e.status == 401:
                    logger.warning("InfluxDB write bypassed: Token unconfigured or unauthorized (401). Telemetry safely saved in Redis & MySQL.")
                else:
                    logger.error(f"Failed to write batch to InfluxDB: {e}")
