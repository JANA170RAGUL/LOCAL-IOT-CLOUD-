"""
app/modules/telemetry

Time-series data ingestion, querying, and aggregation via InfluxDB.
"""

from app.modules.telemetry.api.telemetry_router import router

__all__ = ["router"]
