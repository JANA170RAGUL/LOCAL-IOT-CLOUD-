"""
app/modules/telemetry/schemas/telemetry.py

Pydantic schemas for the Telemetry module.
Handles data history queries and JSON validation.
"""

from datetime import datetime
from typing import Union

from pydantic import BaseModel, Field


TelemetryValue = Union[
    float,
    int,
    bool,
    str,
]


class TelemetryIngestRequest(BaseModel):
    """
    Payload sent by an authenticated physical device.

    Notice that device_id is intentionally NOT accepted here.
    Device identity comes from X-Device-Key.
    """

    sensor: str = Field(
        ...,
        min_length=1,
        max_length=50,
        description="Registered sensor code",
    )

    value: TelemetryValue = Field(
        ...,
        description="Telemetry reading",
    )

    timestamp: datetime | None = Field(
        default=None,
        description="Optional device timestamp",
    )


class TelemetryIngestResponse(BaseModel):
    status: str
    message: str
    device_id: str
    sensor_code: str


class TelemetryPointResponse(BaseModel):
    """Normalized point retrieved from InfluxDB."""
    sensor_code: str
    sensor_type: str
    value: Union[float, bool, str]
    raw_value: Union[float, bool, str]
    timestamp: datetime


class TelemetryLatestResponse(BaseModel):
    """Latest reading for a specific sensor."""
    sensor_code: str
    sensor_type: str
    data_type: str
    value: Union[float, bool, str]
    raw_value: Union[float, bool, str]
    timestamp: datetime


class TelemetryHistoryResponse(BaseModel):
    """List of historical telemetry points matching query criteria."""
    device_id: str
    sensor_codes: list[str]
    total_points: int
    items: list[TelemetryPointResponse]
