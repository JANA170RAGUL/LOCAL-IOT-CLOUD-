"""
app/modules/sensors/api/sensor_router.py

FastAPI router for the Sensors endpoints.

Mounted at: /
This router handles hierarchical device-scoped sensor endpoints
as well as sensor-specific endpoints.

Endpoints
---------
POST   /devices/{device_id}/sensors/    Create a new sensor
GET    /devices/{device_id}/sensors/    List sensors for a device
GET    /sensors/{sensor_id}             Get a single sensor by UUID
PATCH  /sensors/{sensor_id}             Partially update a sensor (PATCH)
PUT    /sensors/{sensor_id}             Partially update a sensor (PUT alias)
DELETE /sensors/{sensor_id}             Soft-delete a sensor
"""

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.core.constants import DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE
from app.database.session import get_db
from app.modules.sensors.dependencies import get_sensor_service
from app.modules.sensors.schemas.sensor import (
    SensorCreate,
    SensorFilter,
    SensorListResponse,
    SensorResponse,
    SensorUpdate,
)
from app.modules.sensors.services.sensor_service import SensorService
from app.shared.iot import SensorType

router = APIRouter(
    tags=["Sensors"],
)


# ---------------------------------------------------------------------------
# POST /devices/{device_id}/sensors/
# ---------------------------------------------------------------------------

@router.post(
    "/devices/{device_id}/sensors/",
    response_model=SensorResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create sensor",
    description="Create a new sensor under a specific device.",
)
def create_sensor(
    device_id: str,
    payload: SensorCreate,
    db: Session = Depends(get_db),
    svc: SensorService = Depends(get_sensor_service),
) -> SensorResponse:
    return svc.create_sensor(db, device_id, payload)


# ---------------------------------------------------------------------------
# GET /devices/{device_id}/sensors/
# ---------------------------------------------------------------------------

@router.get(
    "/devices/{device_id}/sensors/",
    response_model=SensorListResponse,
    summary="List sensors",
    description="List all sensors belonging to a device with optional search, status, and sensor_type filtering.",
)
def list_sensors(
    device_id: str,
    search: str | None = Query(None, description="Keyword search across name and code"),
    sensor_status: str | None = Query(
        None,
        alias="status",
        pattern="^(ACTIVE|INACTIVE|SUSPENDED|TRIAL|EXPIRED)$",
        description="Filter by sensor lifecycle status",
    ),
    sensor_type: SensorType | None = Query(None, description="Filter by sensor type"),
    page: int = Query(1, ge=1, description="Page number (1-indexed)"),
    page_size: int = Query(DEFAULT_PAGE_SIZE, ge=1, le=MAX_PAGE_SIZE, description="Items per page"),
    db: Session = Depends(get_db),
    svc: SensorService = Depends(get_sensor_service),
) -> SensorListResponse:
    filters = SensorFilter(
        search=search,
        status=sensor_status,
        sensor_type=sensor_type,
        page=page,
        page_size=page_size,
    )
    return svc.list_sensors(db, device_id, filters)


# ---------------------------------------------------------------------------
# GET /sensors/{sensor_id}
# ---------------------------------------------------------------------------

@router.get(
    "/sensors/{sensor_id}",
    response_model=SensorResponse,
    summary="Get sensor",
    description="Fetch details of a single sensor by UUID.",
)
def get_sensor(
    sensor_id: str,
    db: Session = Depends(get_db),
    svc: SensorService = Depends(get_sensor_service),
) -> SensorResponse:
    return svc.get_sensor(db, sensor_id)


# ---------------------------------------------------------------------------
# PATCH /sensors/{sensor_id}
# ---------------------------------------------------------------------------

@router.patch(
    "/sensors/{sensor_id}",
    response_model=SensorResponse,
    summary="Partially update sensor (PATCH)",
    description="Partially update a sensor's fields. Only fields provided in the body are modified.",
)
def patch_sensor(
    sensor_id: str,
    payload: SensorUpdate,
    db: Session = Depends(get_db),
    svc: SensorService = Depends(get_sensor_service),
) -> SensorResponse:
    return svc.update_sensor(db, sensor_id, payload)


# ---------------------------------------------------------------------------
# PUT /sensors/{sensor_id}
# ---------------------------------------------------------------------------

@router.put(
    "/sensors/{sensor_id}",
    response_model=SensorResponse,
    summary="Update sensor (PUT)",
    description="Update a sensor's fields. Works exactly like PATCH (partial update).",
)
def put_sensor(
    sensor_id: str,
    payload: SensorUpdate,
    db: Session = Depends(get_db),
    svc: SensorService = Depends(get_sensor_service),
) -> SensorResponse:
    return svc.update_sensor(db, sensor_id, payload)


# ---------------------------------------------------------------------------
# DELETE /sensors/{sensor_id}
# ---------------------------------------------------------------------------

@router.delete(
    "/sensors/{sensor_id}",
    summary="Deactivate sensor",
    description="Soft-delete a sensor. Sets is_active=False and status=INACTIVE.",
    status_code=status.HTTP_200_OK,
)
def delete_sensor(
    sensor_id: str,
    db: Session = Depends(get_db),
    svc: SensorService = Depends(get_sensor_service),
) -> dict:
    return svc.deactivate_sensor(db, sensor_id)
