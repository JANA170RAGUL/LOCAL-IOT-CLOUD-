"""
app/modules/telemetry/api/telemetry_router.py

FastAPI router for Telemetry endpoints.
Provides historical querying from InfluxDB, direct HTTP ingestion,
and real-time live-streaming via WebSockets.

Mounted at: /
"""

import asyncio
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

    try:
        tables = query_api.query(query, org=settings.influx_org)
    except Exception as e:
        logger.error(f"InfluxDB query failure: {e}")
        return []

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

    try:
        tables = query_api.query(query, org=settings.influx_org)
    except Exception as e:
        logger.error(f"InfluxDB history query failure: {e}")
        return TelemetryHistoryResponse(
            device_id=device_id,
            sensor_codes=sensor_codes or [],
            total_points=0,
            items=[],
        )

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
    items.sort(key=lambda x: x.timestamp)

    return TelemetryHistoryResponse(
        device_id=device_id,
        sensor_codes=sensor_codes or list({item.sensor_code for item in items}),
        total_points=len(items),
        items=items,
    )


# ---------------------------------------------------------------------------
# WS /devices/{device_id}/telemetry/stream
# ---------------------------------------------------------------------------

@router.websocket("/devices/{device_id}/telemetry/stream")
async def websocket_telemetry_stream(
    websocket: WebSocket,
    device_id: str,
    db: Session = Depends(get_db),
):
    """
    Subscribes to Redis PubSub for real-time telemetry from the worker
    and forwards it to the WebSocket client connection.
    """
    await websocket.accept()
    logger.info(f"WebSocket client connected to telemetry stream: {device_id}")

    # Verify device
    device = db.scalar(select(Device).where(Device.id == device_id))
    if not device or not device.is_active:
        await websocket.send_json({"error": "Device not found or inactive."})
        await websocket.close()
        return

    r = get_redis_client()
    pubsub = r.pubsub()
    pubsub.subscribe(f"telemetry:stream:{device_id}")

    try:
        # Run a poll listener loop
        while True:
            # Check connection state (allows detecting disconnects)
            # We wait 10ms for messages from Redis PubSub
            msg = pubsub.get_message(ignore_subscribe_messages=True, timeout=0.01)
            if msg:
                data = msg["data"]
                # Send text data straight through
                await websocket.send_text(data)

            # Prevent CPU thrashing by allowing async context switch
            await asyncio.sleep(0.01)
    except WebSocketDisconnect:
        logger.info(f"WebSocket client disconnected from telemetry stream: {device_id}")
    finally:
        pubsub.unsubscribe(f"telemetry:stream:{device_id}")
        pubsub.close()
