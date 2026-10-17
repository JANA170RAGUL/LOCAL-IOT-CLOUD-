"""
app/modules/telemetry/schemas/websocket.py

Schemas for WebSocket short-lived tickets.
"""

from pydantic import BaseModel, Field


class TelemetryWebSocketTicketRequest(BaseModel):
    sensor_id: str = Field(..., description="ID or code of sensor or device for WebSocket stream")


class TelemetryWebSocketTicketResponse(BaseModel):
    ticket: str = Field(..., description="Short-lived one-time ticket string")
    expires_in: int = Field(..., description="TTL in seconds (e.g. 30)")
