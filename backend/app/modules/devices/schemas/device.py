"""
app/modules/devices/schemas/device.py

Pydantic schemas for the Device module.

Schema hierarchy
----------------
DeviceBase          — shared fields (Create + Response)
DeviceCreate        — input for POST /gateways/{gateway_id}/devices/
DeviceUpdate        — input for PATCH /devices/{device_id} (all optional)
DeviceResponse      — full record returned to the caller
DeviceSummary       — lightweight item inside list responses
DeviceFilter        — query params for GET /gateways/{gateway_id}/devices/
DeviceListResponse  — paginated list envelope
"""

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field

# ---------------------------------------------------------------------------
# Valid status values (mirrors the model column)
# ---------------------------------------------------------------------------

VALID_STATUSES = {"ACTIVE", "INACTIVE", "SUSPENDED", "TRIAL", "EXPIRED"}
STATUS_PATTERN = "^(ACTIVE|INACTIVE|SUSPENDED|TRIAL|EXPIRED)$"


# ---------------------------------------------------------------------------
# Base — shared fields
# ---------------------------------------------------------------------------

class DeviceBase(BaseModel):
    code: str = Field(..., min_length=2, max_length=20, description="Short unique code within the gateway")
    name: str = Field(..., min_length=3, max_length=150)
    description: Optional[str] = Field(None, description="Optional summary of the device")
    device_type: Optional[str] = Field(None, max_length=50, description="Category of device (e.g. sensor_node)")
    manufacturer: Optional[str] = Field(None, max_length=100, description="Manufacturer name")
    model: Optional[str] = Field(None, max_length=100, description="Model number/name")
    serial_number: Optional[str] = Field(None, max_length=100, description="Unique serial number")
    firmware_version: Optional[str] = Field(None, max_length=50, description="Device firmware version")
    hardware_version: Optional[str] = Field(None, max_length=50, description="Device hardware version")
    mac_address: Optional[str] = Field(None, max_length=17, description="Device MAC address")
    ip_address: Optional[str] = Field(None, max_length=45, description="Device IP address")


# ---------------------------------------------------------------------------
# Create — POST /gateways/{gateway_id}/devices/
# ---------------------------------------------------------------------------

class DeviceCreate(DeviceBase):
    """
    Payload for creating a new device.

    gateway_id is supplied by the URL path parameter, not the body.
    status is declared here so model_dump() always includes it — prevents column default fallback.
    """
    status: str = Field(
        "ACTIVE",
        pattern=STATUS_PATTERN,
        description="Initial lifecycle status",
    )


# ---------------------------------------------------------------------------
# Update — PATCH /devices/{device_id} (all fields optional)
# ---------------------------------------------------------------------------

class DeviceUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=3, max_length=150)
    description: Optional[str] = None
    device_type: Optional[str] = Field(None, max_length=50)
    manufacturer: Optional[str] = Field(None, max_length=100)
    model: Optional[str] = Field(None, max_length=100)
    serial_number: Optional[str] = Field(None, max_length=100)
    firmware_version: Optional[str] = Field(None, max_length=50)
    hardware_version: Optional[str] = Field(None, max_length=50)
    mac_address: Optional[str] = Field(None, max_length=17)
    ip_address: Optional[str] = Field(None, max_length=45)
    status: Optional[str] = Field(None, pattern=STATUS_PATTERN)


# ---------------------------------------------------------------------------
# Response — full record
# ---------------------------------------------------------------------------

class DeviceResponse(DeviceBase):
    model_config = ConfigDict(from_attributes=True)

    id: str
    gateway_id: str
    status: str
    last_seen: Optional[datetime] = None
    api_key: Optional[str] = Field(None, description="Generated primary API key on device creation")

    # Audit
    created_at: datetime
    updated_at: datetime
    is_active: bool


# ---------------------------------------------------------------------------
# Summary — lightweight item in list responses
# ---------------------------------------------------------------------------

class DeviceSummary(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    gateway_id: str
    code: str
    name: str
    status: str
    device_type: Optional[str] = None
    is_active: bool


# ---------------------------------------------------------------------------
# Filter — query parameters for GET /gateways/{gateway_id}/devices/
# ---------------------------------------------------------------------------

class DeviceFilter(BaseModel):
    """Query parameters accepted by the list_devices endpoint."""
    search: Optional[str] = Field(None, description="Keyword search on name, code")
    status: Optional[str] = Field(None, pattern=STATUS_PATTERN, description="Filter by status")
    device_type: Optional[str] = Field(None, description="Filter by device type")
    page: int = Field(1, ge=1)
    page_size: int = Field(20, ge=1, le=200)


# ---------------------------------------------------------------------------
# Paginated list response
# ---------------------------------------------------------------------------

class DeviceListResponse(BaseModel):
    total: int
    page: int
    page_size: int
    total_pages: int
    items: list[DeviceSummary]
