"""
app/modules/telemetry/api/router.py

FastAPI router for the Telemetry module.

Mounted at: /api/v1/telemetry

Time-series data ingestion, querying, and aggregation via InfluxDB.
"""

from fastapi import APIRouter

router = APIRouter(
    prefix="/telemetry",
    tags=["Telemetry"],
)


# ---------------------------------------------------------------------------
# Placeholder – replace with real endpoints as the module is implemented
# ---------------------------------------------------------------------------

@router.get("/", summary="List telemetry", description="Time-series data ingestion, querying, and aggregation via InfluxDB.")
def list_telemetry() -> dict:
    """Stub endpoint – returns a not-implemented message."""
    return {
        "module": "telemetry",
        "status": "not_implemented",
        "message": "This module is under construction.",
    }
