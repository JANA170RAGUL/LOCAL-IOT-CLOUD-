"""
app/modules/devices/api/device_router.py

FastAPI router for the Devices endpoints.

Mounted at: /
This router handles hierarchical gateway-scoped device endpoints
as well as device-specific endpoints.

Endpoints
---------
POST   /gateways/{gateway_id}/devices/    Create a new device
GET    /gateways/{gateway_id}/devices/    List devices for a gateway
GET    /devices/{device_id}               Get a single device by UUID
PATCH  /devices/{device_id}               Partially update a device (PATCH)
PUT    /devices/{device_id}               Partially update a device (PUT alias)
DELETE /devices/{device_id}               Soft-delete a device
"""

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.core.constants import DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE
from app.database.session import get_db
from app.modules.devices.dependencies import get_device_service
from app.modules.devices.models.device import Device
from app.modules.licensing.dependencies import check_feature_limit
from app.modules.devices.schemas.device import (
    DeviceCreate,
    DeviceFilter,
    DeviceListResponse,
    DeviceResponse,
    DeviceUpdate,
)
from app.modules.devices.services.device_service import DeviceService

router = APIRouter(
    tags=["Devices"],
)


# ---------------------------------------------------------------------------
# POST /gateways/{gateway_id}/devices/
# ---------------------------------------------------------------------------

@router.post(
    "/gateways/{gateway_id}/devices/",
    response_model=DeviceResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create device",
    description="Create a new device under a specific gateway.",
)
def create_device(
    gateway_id: str,
    payload: DeviceCreate,
    db: Session = Depends(get_db),
    svc: DeviceService = Depends(get_device_service),
) -> DeviceResponse:
    # License limit check
    current_count = db.query(Device).filter(Device.is_active == True).count()
    check_feature_limit("devices", current_count)
    
    return svc.create_device(db, gateway_id, payload)


# ---------------------------------------------------------------------------
# GET /gateways/{gateway_id}/devices/
# ---------------------------------------------------------------------------

@router.get(
    "/gateways/{gateway_id}/devices/",
    response_model=DeviceListResponse,
    summary="List devices",
    description="List all devices belonging to a gateway with optional search, status, and device_type filtering.",
)
def list_devices(
    gateway_id: str,
    search: str | None = Query(None, description="Keyword search across name and code"),
    device_status: str | None = Query(
        None,
        alias="status",
        pattern="^(ACTIVE|INACTIVE|SUSPENDED|TRIAL|EXPIRED)$",
        description="Filter by device lifecycle status",
    ),
    device_type: str | None = Query(None, description="Filter by device type category"),
    page: int = Query(1, ge=1, description="Page number (1-indexed)"),
    page_size: int = Query(DEFAULT_PAGE_SIZE, ge=1, le=MAX_PAGE_SIZE, description="Items per page"),
    db: Session = Depends(get_db),
    svc: DeviceService = Depends(get_device_service),
) -> DeviceListResponse:
    filters = DeviceFilter(
        search=search,
        status=device_status,
        device_type=device_type,
        page=page,
        page_size=page_size,
    )
    return svc.list_devices(db, gateway_id, filters)


# ---------------------------------------------------------------------------
# GET /devices/{device_id}
# ---------------------------------------------------------------------------

@router.get(
    "/devices/{device_id}",
    response_model=DeviceResponse,
    summary="Get device",
    description="Fetch details of a single device by UUID.",
)
def get_device(
    device_id: str,
    db: Session = Depends(get_db),
    svc: DeviceService = Depends(get_device_service),
) -> DeviceResponse:
    return svc.get_device(db, device_id)


# ---------------------------------------------------------------------------
# PATCH /devices/{device_id}
# ---------------------------------------------------------------------------

@router.patch(
    "/devices/{device_id}",
    response_model=DeviceResponse,
    summary="Partially update device (PATCH)",
    description="Partially update a device's fields. Only fields provided in the body are modified.",
)
def patch_device(
    device_id: str,
    payload: DeviceUpdate,
    db: Session = Depends(get_db),
    svc: DeviceService = Depends(get_device_service),
) -> DeviceResponse:
    return svc.update_device(db, device_id, payload)


# ---------------------------------------------------------------------------
# PUT /devices/{device_id}
# ---------------------------------------------------------------------------

@router.put(
    "/devices/{device_id}",
    response_model=DeviceResponse,
    summary="Update device (PUT)",
    description="Update a device's fields. Works exactly like PATCH (partial update).",
)
def put_device(
    device_id: str,
    payload: DeviceUpdate,
    db: Session = Depends(get_db),
    svc: DeviceService = Depends(get_device_service),
) -> DeviceResponse:
    return svc.update_device(db, device_id, payload)


# ---------------------------------------------------------------------------
# DELETE /devices/{device_id}
# ---------------------------------------------------------------------------

@router.delete(
    "/devices/{device_id}",
    summary="Deactivate device",
    description="Soft-delete a device. Sets is_active=False and status=INACTIVE.",
    status_code=status.HTTP_200_OK,
)
def delete_device(
    device_id: str,
    db: Session = Depends(get_db),
    svc: DeviceService = Depends(get_device_service),
) -> dict:
    return svc.deactivate_device(db, device_id)
