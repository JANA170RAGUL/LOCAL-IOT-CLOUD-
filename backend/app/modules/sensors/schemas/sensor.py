"""
app/modules/sensors/schemas/sensor.py

Pydantic schemas for the Sensor module.

Schema hierarchy
----------------
SensorBase          — shared fields (Create + Response)
SensorCreate        — input for POST /devices/{device_id}/sensors/
SensorUpdate        — input for PATCH /sensors/{sensor_id} (all optional)
SensorResponse      — full record returned to the caller
SensorSummary       — lightweight item inside list responses
SensorFilter        — query params for GET /devices/{device_id}/sensors/
SensorListResponse  — paginated list envelope
"""

from datetime import datetime
from typing import Any, Optional

from pydantic import BaseModel, ConfigDict, Field, field_validator

from app.core.constants import DataType
from app.shared.iot import MeasurementUnit, SensorType

# ---------------------------------------------------------------------------
# Valid status values (mirrors the model column)
# ---------------------------------------------------------------------------

VALID_STATUSES = {"ACTIVE", "INACTIVE", "SUSPENDED", "TRIAL", "EXPIRED"}
STATUS_PATTERN = "^(ACTIVE|INACTIVE|SUSPENDED|TRIAL|EXPIRED)$"


# ---------------------------------------------------------------------------
# Base — shared fields
# ---------------------------------------------------------------------------

class SensorBase(BaseModel):
    code: str = Field(..., min_length=2, max_length=20, description="Short unique code within the device")
    name: str = Field(..., min_length=3, max_length=150)
    sensor_type: str = Field(SensorType.CUSTOM.value, description="Primary type of the sensor")
    unit: Optional[str] = Field(None, description="Standard or custom measurement unit symbol")
    data_type: str = Field(DataType.NUMBER.value, description="Telemetry data type (e.g. number)")

    # Boundaries
    min_value: Optional[float] = Field(None, description="Optional minimum boundary")
    max_value: Optional[float] = Field(None, description="Optional maximum boundary")
    default_value: Optional[str] = Field(None, max_length=255, description="Default reading value as string")

    # Sampling & Calibration
    sampling_interval: Optional[int] = Field(5, ge=1, description="Interval in seconds between readings")
    calibration_offset: float = Field(0.0, description="Calibration offset additive factor")
    calibration_scale: float = Field(1.0, description="Calibration scale multiplier factor")

    @field_validator("unit", mode="before")
    @classmethod
    def sanitize_unit(cls, v: Any) -> Any:
        if isinstance(v, str):
            v = v.strip()
            if not v:
                return None
        return v


# ---------------------------------------------------------------------------
# Create — POST /devices/{device_id}/sensors/
# ---------------------------------------------------------------------------

class SensorCreate(SensorBase):
    """
    Payload for creating a new sensor.

    device_id is supplied by the URL path parameter, not the body.
    status is declared here so model_dump() always includes it — prevents column default fallback.
    """
    status: str = Field(
        "ACTIVE",
        pattern=STATUS_PATTERN,
        description="Initial lifecycle status",
    )


# ---------------------------------------------------------------------------
# Update — PATCH /sensors/{sensor_id} (all fields optional)
# ---------------------------------------------------------------------------

class SensorUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=3, max_length=150)
    sensor_type: Optional[str] = None
    unit: Optional[str] = None
    data_type: Optional[str] = None

    min_value: Optional[float] = None
    max_value: Optional[float] = None
    default_value: Optional[str] = Field(None, max_length=255)

    sampling_interval: Optional[int] = Field(None, ge=1)
    calibration_offset: Optional[float] = None
    calibration_scale: Optional[float] = None

    status: Optional[str] = Field(None, pattern=STATUS_PATTERN)

    @field_validator("unit", mode="before")
    @classmethod
    def sanitize_unit(cls, v: Any) -> Any:
        if isinstance(v, str):
            v = v.strip()
            if not v:
                return None
        return v


# ---------------------------------------------------------------------------
# Response — full record
# ---------------------------------------------------------------------------

class SensorResponse(SensorBase):
    model_config = ConfigDict(from_attributes=True)

    id: str
    device_id: str
    status: str
    last_reading_at: Optional[datetime] = None

    # Audit
    created_at: datetime
    updated_at: datetime
    is_active: bool


# ---------------------------------------------------------------------------
# Summary — lightweight item in list responses
# ---------------------------------------------------------------------------

class SensorSummary(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    device_id: str
    code: str
    name: str
    status: str
    sensor_type: str
    unit: Optional[str] = None
    is_active: bool

    @field_validator("unit", mode="before")
    @classmethod
    def sanitize_unit(cls, v: Any) -> Any:
        if isinstance(v, str):
            v = v.strip()
            if not v:
                return None
        return v


# ---------------------------------------------------------------------------
# Filter — query parameters for GET /devices/{device_id}/sensors/
# ---------------------------------------------------------------------------

class SensorFilter(BaseModel):
    """Query parameters accepted by the list_sensors endpoint."""
    search: Optional[str] = Field(None, description="Keyword search on name, code")
    status: Optional[str] = Field(None, pattern=STATUS_PATTERN, description="Filter by status")
    sensor_type: Optional[str] = Field(None, description="Filter by sensor type string")
    page: int = Field(1, ge=1)
    page_size: int = Field(20, ge=1, le=200)


# ---------------------------------------------------------------------------
# Paginated list response
# ---------------------------------------------------------------------------

class SensorListResponse(BaseModel):
    total: int
    page: int
    page_size: int
    total_pages: int
    items: list[SensorSummary]
