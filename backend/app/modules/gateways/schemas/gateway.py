"""
app/modules/gateways/schemas/gateway.py

Pydantic schemas for the Gateway module.

Schema hierarchy
----------------
GatewayBase          — shared fields (Create + Response)
GatewayCreate        — input for POST /projects/{project_id}/gateways/
GatewayUpdate        — input for PATCH /gateways/{gateway_id} (all optional)
GatewayResponse      — full record returned to the caller
GatewaySummary       — lightweight item inside list responses
GatewayFilter        — query params for GET /projects/{project_id}/gateways/
GatewayListResponse  — paginated list envelope
"""

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field

# ---------------------------------------------------------------------------
# Valid status values (mirrors the model column)
# ---------------------------------------------------------------------------

VALID_STATUSES = {"ACTIVE", "INACTIVE", "SUSPENDED", "TRIAL", "EXPIRED"}
STATUS_PATTERN = "^(ACTIVE|INACTIVE|SUSPENDED|TRIAL|EXPIRED)$"

VALID_PROTOCOLS = {"MQTT", "HTTP", "COAP", "WEBSOCKET", "MODBUS", "OPC_UA"}
PROTOCOL_PATTERN = "^(MQTT|HTTP|COAP|WEBSOCKET|MODBUS|OPC_UA)$"


# ---------------------------------------------------------------------------
# Base — shared fields
# ---------------------------------------------------------------------------

class GatewayBase(BaseModel):
    code: str = Field(..., min_length=2, max_length=20, description="Short unique code within the project")
    name: str = Field(..., min_length=3, max_length=150)
    description: Optional[str] = Field(None, description="Optional summary of the gateway")
    location: Optional[str] = Field(None, max_length=255, description="Physical location")
    ip_address: Optional[str] = Field(None, max_length=45, description="IP address (v4 or v6)")
    mac_address: Optional[str] = Field(None, max_length=17, description="MAC address")
    firmware_version: Optional[str] = Field(None, max_length=50, description="Firmware version string")
    protocol: str = Field("MQTT", pattern=PROTOCOL_PATTERN, description="Connectivity protocol")
    mqtt_topic: Optional[str] = Field(None, max_length=255, description="Primary MQTT topic prefix")


# ---------------------------------------------------------------------------
# Create — POST /projects/{project_id}/gateways/
# ---------------------------------------------------------------------------

class GatewayCreate(GatewayBase):
    """
    Payload for creating a new gateway.

    project_id is supplied by the URL path parameter, not the body.
    status is declared here so model_dump() always includes it — prevents column default fallback.
    """
    status: str = Field(
        "ACTIVE",
        pattern=STATUS_PATTERN,
        description="Initial lifecycle status",
    )


# ---------------------------------------------------------------------------
# Update — PATCH /gateways/{gateway_id} (all fields optional)
# ---------------------------------------------------------------------------

class GatewayUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=3, max_length=150)
    description: Optional[str] = None
    location: Optional[str] = Field(None, max_length=255)
    ip_address: Optional[str] = Field(None, max_length=45)
    mac_address: Optional[str] = Field(None, max_length=17)
    firmware_version: Optional[str] = Field(None, max_length=50)
    status: Optional[str] = Field(None, pattern=STATUS_PATTERN)
    protocol: Optional[str] = Field(None, pattern=PROTOCOL_PATTERN)
    mqtt_topic: Optional[str] = Field(None, max_length=255)


# ---------------------------------------------------------------------------
# Response — full record
# ---------------------------------------------------------------------------

class GatewayResponse(GatewayBase):
    model_config = ConfigDict(from_attributes=True)

    id: str
    project_id: str
    status: str
    last_seen: Optional[datetime] = None

    # Audit
    created_at: datetime
    updated_at: datetime
    is_active: bool


# ---------------------------------------------------------------------------
# Summary — lightweight item in list responses
# ---------------------------------------------------------------------------

class GatewaySummary(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    project_id: str
    code: str
    name: str
    status: str
    protocol: str
    is_active: bool


# ---------------------------------------------------------------------------
# Filter — query parameters for GET /projects/{project_id}/gateways/
# ---------------------------------------------------------------------------

class GatewayFilter(BaseModel):
    """Query parameters accepted by the list_gateways endpoint."""
    search: Optional[str] = Field(None, description="Keyword search on name, code")
    status: Optional[str] = Field(None, pattern=STATUS_PATTERN, description="Filter by status")
    protocol: Optional[str] = Field(None, pattern=PROTOCOL_PATTERN, description="Filter by protocol")
    page: int = Field(1, ge=1)
    page_size: int = Field(20, ge=1, le=200)


# ---------------------------------------------------------------------------
# Paginated list response
# ---------------------------------------------------------------------------

class GatewayListResponse(BaseModel):
    total: int
    page: int
    page_size: int
    total_pages: int
    items: list[GatewaySummary]
