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

from fastapi import APIRouter, Depends, HTTPException, Query, WebSocket, WebSocketDisconnect, status
from sqlalchemy import or_, select
from sqlalchemy.orm import Session

from app.core.access_scope import AccessScope, get_access_scope
from app.core.auth import get_current_user
from app.core.constants import AggregationFunction
from app.core.tenant_guard import TenantGuard
from app.database.influx import query_api, settings
from app.database.redis import get_redis_client
from app.database.session import get_db
from app.modules.devices.models.device import Device
from app.modules.gateways.models.gateway import Gateway
from app.modules.sensors.models.sensor import Sensor
from app.modules.telemetry.dependencies import get_authenticated_device
from app.modules.telemetry.schemas.telemetry import (
    TelemetryHistoryResponse,
    TelemetryLatestResponse,
    TelemetryPointResponse,
    TelemetryIngestRequest,
    TelemetryIngestResponse,
)
from app.modules.telemetry.schemas.websocket import (
    TelemetryWebSocketTicketRequest,
    TelemetryWebSocketTicketResponse,
)
from app.modules.telemetry.services.payload_validator import PayloadValidator
from app.modules.telemetry.services.queue_manager import QueueManager
from app.modules.telemetry.services.telemetry_authorizer import TelemetryAuthorizer
from app.modules.telemetry.services.websocket_ticket_service import (
    TICKET_TTL_SECONDS,
    WebSocketTicketService,
)
from app.modules.users.models.user import User

logger = logging.getLogger(__name__)

router = APIRouter(
    tags=["Telemetry"],
)


# ---------------------------------------------------------------------------
# Helper Query Functions
# ---------------------------------------------------------------------------

def _query_latest_telemetry_by_device_id(device_id: str) -> list[TelemetryLatestResponse]:
    """Fetch latest readings from InfluxDB with Redis fallback."""
    query = f'''
    from(bucket: "{settings.influx_bucket}")
      |> range(start: -30d)
      |> filter(fn: (r) => r["_measurement"] == "telemetry")
      |> filter(fn: (r) => r["device_id"] == "{device_id}")
      |> last()
    '''

    tables = []
    try:
        tables = query_api.query(query, org=settings.influx_org)
    except Exception as e:
        logger.error(f"InfluxDB query failure: {e}")

    latest_readings = {}
    for table in tables:
        for record in table.records:
            sensor_code = record.values.get("sensor_code")
            sensor_type = record.values.get("sensor_type")
            field = record.get_field()
            val = record.get_value()
            ts = record.get_time()

            if sensor_code not in latest_readings:
                latest_readings[sensor_code] = {
                    "sensor_code": sensor_code,
                    "sensor_type": sensor_type,
                    "timestamp": ts,
                }

            if field == "value":
                latest_readings[sensor_code]["value"] = val
            elif field == "raw_value":
                latest_readings[sensor_code]["raw_value"] = val

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


def _query_history_telemetry(
    device_id: str,
    sensor_codes: Optional[list[str]] = None,
    start_time: str = "-24h",
    end_time: str = "now()",
    aggregation: Optional[AggregationFunction] = None,
    window: Optional[str] = None,
    db: Optional[Session] = None,
) -> TelemetryHistoryResponse:
    """Historical time-series query builder for InfluxDB with Redis fallback."""
    start_clause = start_time if (start_time.startswith("-") or start_time == "now()") else f'{start_time}'
    stop_clause = end_time if end_time == "now()" else f'{end_time}'

    # Pre-fetch sensor_type mapping from MySQL DB for robust fallback
    sensor_type_map = {}
    if db:
        try:
            sensors = db.query(Sensor).filter(Sensor.device_id == device_id).all()
            for s in sensors:
                sensor_type_map[s.code] = s.sensor_type
        except Exception as db_err:
            logger.warning(f"Failed fetching sensor types from MySQL: {db_err}")

    flux_parts = [
        f'from(bucket: "{settings.influx_bucket}")',
        f'  |> range(start: {start_clause}, stop: {stop_clause})',
        '  |> filter(fn: (r) => r["_measurement"] == "telemetry")',
        f'  |> filter(fn: (r) => r["device_id"] == "{device_id}")'
    ]

    if sensor_codes:
        code_filters = " or ".join([f'r["sensor_code"] == "{code}"' for code in sensor_codes])
        flux_parts.append(f'  |> filter(fn: (r) => {code_filters})')

    if aggregation and window:
        flux_parts.append(f'  |> aggregateWindow(every: {window}, fn: {aggregation.value}, createEmpty: false)')

    query = "\n".join(flux_parts)

    tables = []
    try:
        tables = query_api.query(query, org=settings.influx_org)
    except Exception as e:
        logger.error(f"InfluxDB history query failure: {e}")

    pivoted_points = {}
    for table in tables:
        for record in table.records:
            sensor_code = record.values.get("sensor_code") or "UNKNOWN"
            sensor_type = record.values.get("sensor_type") or sensor_type_map.get(sensor_code) or "sensor"
            ts = record.get_time()
            field = record.get_field()
            val = record.get_value()

            pkey = (sensor_code, ts.isoformat())
            if pkey not in pivoted_points:
                pivoted_points[pkey] = {
                    "sensor_code": sensor_code,
                    "sensor_type": sensor_type,
                    "timestamp": ts,
                }
            pivoted_points[pkey][field] = val

    if not pivoted_points:
        try:
            r = get_redis_client()
            keys = r.keys(f"telemetry:history:{device_id}:*")
            for k in keys:
                hist_items = r.lrange(k, 0, 99)
                for item_bytes in hist_items:
                    item_data = json.loads(item_bytes)
                    s_code = item_data.get("sensor_code", "UNKNOWN")
                    s_type = item_data.get("sensor_type") or sensor_type_map.get(s_code) or "sensor"
                    ts_str = item_data.get("timestamp")

                    if sensor_codes and s_code not in sensor_codes:
                        continue

                    pkey = (s_code, ts_str)
                    if pkey not in pivoted_points:
                        pivoted_points[pkey] = {
                            "sensor_code": s_code,
                            "sensor_type": s_type,
                            "value": item_data.get("value"),
                            "raw_value": item_data.get("raw_value"),
                            "timestamp": ts_str,
                        }
        except Exception as r_err:
            logger.warning(f"Redis history fallback query failed: {r_err}")

    items = []
    for read in pivoted_points.values():
        code = read.get("sensor_code") or "UNKNOWN"
        stype = read.get("sensor_type") or sensor_type_map.get(code) or "sensor"
        val = read.get("value")
        if val is None:
            val = read.get("raw_value", 0)
        raw_val = read.get("raw_value")
        if raw_val is None:
            raw_val = val

        items.append(
            TelemetryPointResponse(
                sensor_code=code,
                sensor_type=stype,
                value=val,
                raw_value=raw_val,
                timestamp=read["timestamp"],
            )
        )

    items.sort(key=lambda x: str(x.timestamp))

    return TelemetryHistoryResponse(
        device_id=device_id,
        sensor_codes=sensor_codes or list({item.sensor_code for item in items}),
        total_points=len(items),
        items=items,
    )


# ---------------------------------------------------------------------------
# POST /devices/{device_id}/telemetry — Ingest Telemetry
# ---------------------------------------------------------------------------

@router.post(
    "/devices/{device_id}/telemetry",
    response_model=TelemetryIngestResponse,
    status_code=status.HTTP_202_ACCEPTED,
    summary="Ingest authenticated device telemetry",
)
def ingest_telemetry_http(
    device_id: str,
    payload: TelemetryIngestRequest,
    authenticated_device: Device = Depends(get_authenticated_device),
    db: Session = Depends(get_db),
) -> TelemetryIngestResponse:

    # 1. Credential must belong to the device in the URL
    if authenticated_device.id != device_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Device credential is not authorized for this device.",
        )

    # 2. Sensor MUST belong to authenticated device
    sensor = TelemetryAuthorizer.get_sensor(
        db,
        authenticated_device,
        payload.sensor,
    )

    # 3. License telemetry limits
    from app.modules.licensing.services.telemetry_limiter import check_telemetry_limits
    redis_client = get_redis_client()
    if not check_telemetry_limits(redis_client):
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Telemetry rate limit or storage limit exceeded for the current license.",
        )

    # 4. Build SERVER-TRUSTED payload
    raw_payload = {
        "device": authenticated_device.id,
        "sensor": sensor.code,
        "value": payload.value,
        "timestamp": (
            payload.timestamp.isoformat()
            if payload.timestamp
            else None
        ),
    }

    validated = PayloadValidator.validate(raw_payload)

    envelope = {
        "payload": validated,
        "gateway_ctx": authenticated_device.gateway_id,
        "source": "HTTP",
    }

    QueueManager.enqueue(envelope)

    return TelemetryIngestResponse(
        status="Accepted",
        message="Telemetry enqueued for processing.",
        device_id=authenticated_device.id,
        sensor_code=sensor.code,
    )


# ---------------------------------------------------------------------------
# GET /devices/{device_id}/telemetry/latest — Device Latest Telemetry
# ---------------------------------------------------------------------------

@router.get(
    "/devices/{device_id}/telemetry/latest",
    response_model=list[TelemetryLatestResponse],
    summary="Get latest telemetry for device",
    description="Fetch the most recent reading for each active sensor of an authorized device.",
)
def get_latest_telemetry(
    device_id: str,
    db: Session = Depends(get_db),
    scope: AccessScope = Depends(get_access_scope),
) -> list[TelemetryLatestResponse]:
    # Security check FIRST
    device = TenantGuard.device(db, device_id, scope)
    return _query_latest_telemetry_by_device_id(device.id)


# ---------------------------------------------------------------------------
# GET /devices/{device_id}/telemetry/history — Device Telemetry History
# ---------------------------------------------------------------------------

@router.get(
    "/devices/{device_id}/telemetry/history",
    response_model=TelemetryHistoryResponse,
    summary="Get telemetry history for device",
    description="Query historical time-series data for an authorized device.",
)
def get_telemetry_history(
    device_id: str,
    start_time: str = Query("-24h", description="Start time range (e.g. -24h, -30d or ISO timestamp)"),
    end_time: str = Query("now()", description="End time range (e.g. now() or ISO timestamp)"),
    sensor_codes: Optional[list[str]] = Query(None, description="Filter for specific sensor codes"),
    aggregation: Optional[AggregationFunction] = Query(None, description="Window aggregation function"),
    window: Optional[str] = Query(None, description="Aggregation window duration (e.g. 1m, 1h)"),
    db: Session = Depends(get_db),
    scope: AccessScope = Depends(get_access_scope),
) -> TelemetryHistoryResponse:
    # Security check FIRST
    device = TenantGuard.device(db, device_id, scope)

    authorized_codes = []
    if sensor_codes:
        for code_or_id in sensor_codes:
            stmt = select(Sensor).where(
                Sensor.device_id == device.id,
                or_(Sensor.code == code_or_id, Sensor.id == code_or_id)
            )
            s_obj = db.scalar(stmt)
            if not s_obj:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Sensor '{code_or_id}' not found under device in user scope.",
                )
            authorized_codes.append(s_obj.code)

    return _query_history_telemetry(
        device_id=device.id,
        sensor_codes=authorized_codes if sensor_codes else None,
        start_time=start_time,
        end_time=end_time,
        aggregation=aggregation,
        window=window,
        db=db,
    )


# ---------------------------------------------------------------------------
# GET /sensors/{sensor_id}/telemetry/latest — Sensor Latest Telemetry
# ---------------------------------------------------------------------------

@router.get(
    "/sensors/{sensor_id}/telemetry/latest",
    response_model=list[TelemetryLatestResponse],
    summary="Get latest telemetry for sensor",
)
def get_sensor_latest_telemetry(
    sensor_id: str,
    db: Session = Depends(get_db),
    scope: AccessScope = Depends(get_access_scope),
) -> list[TelemetryLatestResponse]:
    # Security check FIRST
    sensor = TenantGuard.sensor(db, sensor_id, scope)

    all_readings = _query_latest_telemetry_by_device_id(sensor.device_id)
    return [r for r in all_readings if r.sensor_code == sensor.code]


# ---------------------------------------------------------------------------
# GET /sensors/{sensor_id}/telemetry/history — Sensor Telemetry History
# ---------------------------------------------------------------------------

@router.get(
    "/sensors/{sensor_id}/telemetry/history",
    response_model=TelemetryHistoryResponse,
    summary="Get telemetry history for sensor",
)
def get_sensor_telemetry_history(
    sensor_id: str,
    start_time: str = Query("-24h", description="Start time range"),
    end_time: str = Query("now()", description="End time range"),
    aggregation: Optional[AggregationFunction] = Query(None),
    window: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    scope: AccessScope = Depends(get_access_scope),
) -> TelemetryHistoryResponse:
    # Security check FIRST
    sensor = TenantGuard.sensor(db, sensor_id, scope)

    return _query_history_telemetry(
        device_id=sensor.device_id,
        sensor_codes=[sensor.code],
        start_time=start_time,
        end_time=end_time,
        aggregation=aggregation,
        window=window,
        db=db,
    )


# ---------------------------------------------------------------------------
# POST /telemetry/ws-ticket — Generate WebSocket Ticket
# ---------------------------------------------------------------------------

@router.post(
    "/telemetry/ws-ticket",
    response_model=TelemetryWebSocketTicketResponse,
    summary="Create short-lived ticket for WebSocket connection",
)
def create_telemetry_ws_ticket(
    payload: TelemetryWebSocketTicketRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    scope: AccessScope = Depends(get_access_scope),
) -> TelemetryWebSocketTicketResponse:
    target_id = payload.sensor_id

    resolved_id = None
    try:
        sensor = TenantGuard.sensor(db, target_id, scope)
        resolved_id = sensor.id
    except HTTPException:
        try:
            device = TenantGuard.device(db, target_id, scope)
            resolved_id = device.id
        except HTTPException:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Sensor or device not found in user organization scope.",
            )

    ticket = WebSocketTicketService.create(
        user_id=current_user.id,
        sensor_id=resolved_id,
    )

    return TelemetryWebSocketTicketResponse(
        ticket=ticket,
        expires_in=TICKET_TTL_SECONDS,
    )


# ---------------------------------------------------------------------------
# WebSockets — Authenticated via Ticket (No long-lived DB Session)
# ---------------------------------------------------------------------------

@router.websocket("/ws/telemetry/{sensor_id}")
async def telemetry_sensor_websocket(
    websocket: WebSocket,
    sensor_id: str,
):
    ticket = websocket.query_params.get("ticket")
    if not ticket:
        await websocket.close(code=4401)
        return

    auth = WebSocketTicketService.consume(ticket)
    if not auth:
        await websocket.close(code=4401)
        return

    if auth.get("sensor_id") != sensor_id:
        await websocket.close(code=4403)
        return

    await websocket.accept()
    logger.info(f"WebSocket client connected for sensor stream: {sensor_id}")

    r = get_redis_client()
    pubsub = r.pubsub()
    pubsub.subscribe(f"telemetry:stream:{sensor_id}")

    try:
        while True:
            msg = pubsub.get_message(ignore_subscribe_messages=True, timeout=0)
            if msg:
                data = msg["data"]
                if isinstance(data, bytes):
                    data = data.decode("utf-8")
                await websocket.send_text(data)
            await asyncio.sleep(0.1)
    except WebSocketDisconnect:
        logger.info(f"WebSocket client disconnected from sensor stream: {sensor_id}")
    finally:
        pubsub.unsubscribe(f"telemetry:stream:{sensor_id}")
        pubsub.close()


@router.websocket("/devices/{device_id}/telemetry/stream")
async def websocket_telemetry_stream(
    websocket: WebSocket,
    device_id: str,
):
    ticket = websocket.query_params.get("ticket")
    if not ticket:
        await websocket.close(code=4401)
        return

    auth = WebSocketTicketService.consume(ticket)
    if not auth:
        await websocket.close(code=4401)
        return

    if auth.get("sensor_id") != device_id:
        await websocket.close(code=4403)
        return

    await websocket.accept()
    logger.info(f"WebSocket client connected to telemetry stream for device: {device_id}")

    r = get_redis_client()
    pubsub = r.pubsub()
    pubsub.subscribe(f"telemetry:stream:{device_id}")

    try:
        while True:
            msg = pubsub.get_message(ignore_subscribe_messages=True, timeout=0)
            if msg:
                data = msg["data"]
                if isinstance(data, bytes):
                    data = data.decode("utf-8")
                await websocket.send_text(data)
            await asyncio.sleep(0.1)
    except WebSocketDisconnect:
        logger.info(f"WebSocket client disconnected from telemetry stream for device: {device_id}")
    finally:
        pubsub.unsubscribe(f"telemetry:stream:{device_id}")
        pubsub.close()
