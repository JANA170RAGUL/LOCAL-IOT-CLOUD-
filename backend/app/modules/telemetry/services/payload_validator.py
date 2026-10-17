"""
app/modules/telemetry/services/payload_validator.py

Validate the format of incoming raw telemetry messages.
"""

from typing import Any, Optional, Union

from pydantic import BaseModel, Field, ValidationError


class RawTelemetryPayload(BaseModel):
    """
    Standard schema for raw telemetry packages.
    Example:
    {
        "device": "ESP32-001",
        "sensor": "TEMP",
        "value": 31.7,
        "timestamp": "2026-07-12T12:00:01Z"
    }
    """
    device: str = Field(..., min_length=1, max_length=64, description="Server-resolved device UUID")
    sensor: str = Field(..., min_length=1, max_length=50, description="Registered sensor code")
    value: Union[float, int, bool, str] = Field(..., description="Telemetry reading value")
    timestamp: Optional[str] = Field(None, max_length=64, description="Optional ISO-8601 timestamp")


class PayloadValidator:

    @staticmethod
    def validate(payload: dict[str, Any]) -> dict[str, Any]:
        """
        Validate payload against schema.
        Returns the parsed dictionary.
        Raises ValueError if validation fails.
        """
        try:
            validated = RawTelemetryPayload(**payload)
            return validated.model_dump()
        except ValidationError as e:
            raise ValueError(f"Invalid telemetry payload: {e.errors()}")
