"""
app/modules/telemetry/api/telemetry_router.py

FastAPI router for Telemetry endpoints.
Provides historical querying from InfluxDB, direct HTTP ingestion,
and real-time live-streaming via WebSockets.

Mounted at: /
"""

import asyncio
import json
import logging
from typing import Optional

from fastapi import APIRouter, Depends, Query, WebSocket, WebSocketDisconnect, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.constants import AggregationFunction
from app.database.influx import query_api, settings
from app.database.redis import get_redis_client
from app.database.session import get_db
from app.modules.devices.models.device import Device
from app.modules.gateways.models.gateway import Gateway
from app.modules.sensors.models.sensor import Sensor
from app.modules.telemetry.schemas.telemetry import (
    TelemetryHistoryResponse,
    TelemetryLatestResponse,
    TelemetryPointResponse,
)
from app.modules.telemetry.services.payload_validator import PayloadValidator
from app.modules.telemetry.services.queue_manager import QueueManager
from app.shared.exceptions.device import DeviceNotFound

logger = logging.getLogger(__name__)

router = APIRouter(
    tags=["Telemetry"],
)


# ---------------------------------------------------------------------------
# POST /devices/{device_id}/telemetry
# ---------------------------------------------------------------------------

@router.post(
    "/devices/{device_id}/telemetry",
    status_code=status.HTTP_202_ACCEPTED,
    summary="Ingest telemetry (HTTP)",
    description="Directly ingest a telemetry package for a device. Payloads are enqueued to Redis.",
)
def ingest_telemetry_http(
    device_id: str,
    payload: dict,
    db: Session = Depends(get_db),
) -> dict:
    """HTTP direct ingestion entrypoint."""
    # Verify device exists and is active
    device = db.scalar(select(Device).where(Device.id == device_id))
    if not device or not device.is_active:
        raise DeviceNotFound()

    # Enforce device UUID match
    payload["device"] = device_id

    # Enforce licensing limits
    from app.database.redis import get_redis_client
    from app.modules.licensing.services.telemetry_limiter import check_telemetry_limits
    redis_client = get_redis_client()
    if not check_telemetry_limits(redis_client):
        from fastapi import HTTPException
        raise HTTPException(status_code=429, detail="Telemetry rate limit or storage limit exceeded per your license plan.")

    validated = PayloadValidator.validate(payload)

    envelope = {
        "payload": validated,
        "gateway_ctx": device.gateway_id,
    }

    QueueManager.enqueue(envelope)
    return {"status": "Accepted", "message": "Telemetry enqueued for processing."}


# ---------------------------------------------------------------------------
# GET /devices/{device_id}/telemetry/latest
# ---------------------------------------------------------------------------

@router.get(
    "/devices/{device_id}/telemetry/latest",
    response_model=list[TelemetryLatestResponse],
    summary="Get latest telemetry",
    description="Fetch the most recent reading for each active sensor of the device.",
)
def get_latest_telemetry(
    device_id: str,
    db: Session = Depends(get_db),
) -> list[TelemetryLatestResponse]:
    """Fetch latest readings from InfluxDB."""
    device = db.scalar(select(Device).where(Device.id == device_id))
    if not device or not device.is_active:
        raise DeviceNotFound()

    # Flux query to fetch the last recorded point for each sensor_code
    query = f'''
    from(bucket: "{settings.influx_bucket}")
      |> range(start: -30d) // Look back 30 days
      |> filter(fn: (r) => r["_measurement"] == "telemetry")
      |> filter(fn: (r) => r["device_id"] == "{device_id}")
      |> last()
    '''

    tables = []
    try:
        tables = query_api.query(query, org=settings.influx_org)
    except Exception as e:
        logger.error(f"InfluxDB query failure: {e}")

    # Map results
    latest_readings = {}
    for table in tables:
        for record in table.records:
            sensor_code = record.values.get("sensor_code")
            sensor_type = record.values.get("sensor_type")
            field = record.get_field()  # 'value' or 'raw_value'
            val = record.get_value()
            ts = record.get_time()

            if sensor_code not in latest_readings:
                latest_readings[sensor_code] = {
                    "sensor_code": sensor_code,
                    "sensor_type": sensor_type,
                    "timestamp": ts,
                }

            # Save raw and calibrated values
            if field == "value":
                latest_readings[sensor_code]["value"] = val
            elif field == "raw_value":
                latest_readings[sensor_code]["raw_value"] = val

    # Redis Fallback if InfluxDB returned empty
    if not latest_readings:
        try:
            r = get_redis_client()
            keys = r.keys(f"telemetry:latest:{device_id}:*")
            for k in keys:
                raw_str = r.get(k)
                if raw_str:
                    item_data = json.loads(raw_str)
                    s_code = item_data.get("sensor_code", "UNKNOWN")
                    latest_readings[s_code] = {
                        "sensor_code": s_code,
                        "sensor_type": item_data.get("sensor_type", "sensor"),
                        "value": item_data.get("value"),
                        "raw_value": item_data.get("raw_value"),
                        "timestamp": item_data.get("timestamp"),
                    }
        except Exception as r_err:
            logger.warning(f"Redis latest fallback query failed: {r_err}")

    # Fill defaults if one of the fields is missing in the record
    results = []
    for code, read in latest_readings.items():
        results.append(
            TelemetryLatestResponse(
                sensor_code=code,
                sensor_type=read["sensor_type"],
                data_type="number" if isinstance(read.get("value"), (int, float)) else "string",
                value=read.get("value", read.get("raw_value")),
                raw_value=read.get("raw_value", read.get("value")),
                timestamp=read["timestamp"],
            )
        )
    return results


# ---------------------------------------------------------------------------
# GET /devices/{device_id}/telemetry/history
# ---------------------------------------------------------------------------

@router.get(
    "/devices/{device_id}/telemetry/history",
    response_model=TelemetryHistoryResponse,
    summary="Get telemetry history",
    description="Query historical time-series data with filter boundaries and optional aggregate windowing.",
)
def get_telemetry_history(
    device_id: str,
    start_time: str = Query("-24h", description="Start time range (e.g. -24h, -30d or ISO timestamp)"),
    end_time: str = Query("now()", description="End time range (e.g. now() or ISO timestamp)"),
    sensor_codes: Optional[list[str]] = Query(None, description="Filter for specific sensor codes"),
    aggregation: Optional[AggregationFunction] = Query(None, description="Window aggregation function"),
    window: Optional[str] = Query(None, description="Aggregation window duration (e.g. 1m, 1h)"),
    db: Session = Depends(get_db),
) -> TelemetryHistoryResponse:
    """Historical time-series query builder."""
    device = db.scalar(select(Device).where(Device.id == device_id))
    if not device or not device.is_active:
        raise DeviceNotFound()

    # Format start and stop bounds
    start_clause = start_time
    if not start_time.startswith("-") and start_time != "now()":
        start_clause = f'{start_time}'

    stop_clause = end_time
    if end_time != "now()":
        stop_clause = f'{end_time}'

    # Build Flux query query
    flux_parts = [
        f'from(bucket: "{settings.influx_bucket}")',
        f'  |> range(start: {start_clause}, stop: {stop_clause})',
        '  |> filter(fn: (r) => r["_measurement"] == "telemetry")',
        f'  |> filter(fn: (r) => r["device_id"] == "{device_id}")'
    ]

    if sensor_codes:
        code_filters = " or ".join([f'r["sensor_code"] == "{code}"' for code in sensor_codes])
        flux_parts.append(f'  |> filter(fn: (r) => {code_filters})')

    # Apply aggregation if specified
    if aggregation and window:
        # InfluxDB aggregate functions: mean, sum, min, max, count, last
        flux_parts.append(f'  |> aggregateWindow(every: {window}, fn: {aggregation.value}, createEmpty: false)')

    query = "\n".join(flux_parts)

    tables = []
    try:
        tables = query_api.query(query, org=settings.influx_org)
    except Exception as e:
        logger.error(f"InfluxDB history query failure: {e}")

    # Pivot fields (raw_value and value) back to single object record
    pivoted_points = {}
    for table in tables:
        for record in table.records:
            sensor_code = record.values.get("sensor_code")
            sensor_type = record.values.get("sensor_type")
            ts = record.get_time()
            field = record.get_field()
            val = record.get_value()

            # Unique key to combine raw_value and value on same timestamp
            pkey = (sensor_code, ts.isoformat())

            if pkey not in pivoted_points:
                pivoted_points[pkey] = {
                    "sensor_code": sensor_code,
                    "sensor_type": sensor_type,
                    "timestamp": ts,
                }
            pivoted_points[pkey][field] = val

    # Redis Fallback if InfluxDB returned empty
    if not pivoted_points:
        try:
            r = get_redis_client()
            keys = r.keys(f"telemetry:history:{device_id}:*")
            for k in keys:
                hist_items = r.lrange(k, 0, 99)
                for item_bytes in hist_items:
                    item_data = json.loads(item_bytes)
                    s_code = item_data.get("sensor_code", "UNKNOWN")
                    ts_str = item_data.get("timestamp")
                    
                    if sensor_codes and s_code not in sensor_codes:
                        continue

                    pkey = (s_code, ts_str)
                    if pkey not in pivoted_points:
                        pivoted_points[pkey] = {
                            "sensor_code": s_code,
                            "sensor_type": item_data.get("sensor_type", "sensor"),
                            "value": item_data.get("value"),
                            "raw_value": item_data.get("raw_value"),
                            "timestamp": ts_str,
                        }
        except Exception as r_err:
            logger.warning(f"Redis history fallback query failed: {r_err}")

    # Convert to schema items
    items = []
    for read in pivoted_points.values():
        items.append(
            TelemetryPointResponse(
                sensor_code=read["sensor_code"],
                sensor_type=read["sensor_type"],
                value=read.get("value", read.get("raw_value")),
                raw_value=read.get("raw_value", read.get("value")),
                timestamp=read["timestamp"],
            )
        )

    # Sort items by timestamp ascending
    items.sort(key=lambda x: str(x.timestamp))

    return TelemetryHistoryResponse(
        device_id=device_id,
        sensor_codes=sensor_codes or list({item.sensor_code for item in items}),
        total_points=len(items),
        items=items,
    )


# ---------------------------------------------------------------------------
# WS /devices/{device_id}/telemetry/stream
# ---------------------------------------------------------------------------

def _resolve_device_id(device_or_sensor_id: str) -> str:
    from sqlalchemy.orm import Session
    from sqlalchemy import select, or_
    from app.database.session import SessionLocal
    from app.modules.devices.models.device import Device
    from app.modules.sensors.models.sensor import Sensor

    try:
        with SessionLocal() as db:
            device = db.scalar(select(Device).where(or_(Device.id == device_or_sensor_id, Device.code == device_or_sensor_id, Device.code.ilike(device_or_sensor_id))))
            if not device:
                sensor = db.scalar(select(Sensor).where(or_(Sensor.id == device_or_sensor_id, Sensor.code == device_or_sensor_id, Sensor.code.ilike(device_or_sensor_id))))
                if sensor:
                    device = db.scalar(select(Device).where(Device.id == sensor.device_id))
            return device.id if device else device_or_sensor_id
    except Exception as e:
        logger.error(f"Error resolving device ID in WebSocket: {e}")
        return device_or_sensor_id


@router.websocket("/devices/{device_id}/telemetry/stream")
async def websocket_telemetry_stream(
    websocket: WebSocket,
    device_id: str,
):
    """
    Subscribes to Redis PubSub for real-time device telemetry.
    """
    await websocket.accept()
    logger.info(f"WebSocket client connected to telemetry stream: {device_id}")

    target_device_id = await asyncio.to_thread(_resolve_device_id, device_id)

    r = get_redis_client()
    pubsub = r.pubsub()
    pubsub.subscribe(f"telemetry:stream:{target_device_id}")

    try:
        while True:
            # timeout=0 means non-blocking
            msg = pubsub.get_message(ignore_subscribe_messages=True, timeout=0)
            if msg:
                data = msg["data"]
                if isinstance(data, bytes):
                    data = data.decode("utf-8")
                await websocket.send_text(data)

            await asyncio.sleep(0.1)  # sleep 100ms
    except WebSocketDisconnect:
        logger.info(f"WebSocket client disconnected from telemetry stream: {device_id}")
    finally:
        pubsub.unsubscribe(f"telemetry:stream:{target_device_id}")
        pubsub.close()
