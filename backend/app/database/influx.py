"""
app/database/influx.py

InfluxDB 2.x connection client.
Provides APIs for time-series writes and queries.
"""

from influxdb_client import InfluxDBClient
from influxdb_client.client.write_api import SYNCHRONOUS

from app.config.settings import settings

# Initialize client
influx_client = InfluxDBClient(
    url=settings.influx_url,
    token=settings.influx_token,
    org=settings.influx_org,
    timeout=settings.influx_timeout_ms,
)

# Synchronous write API is best for our worker loop processing
write_api = influx_client.write_api(write_options=SYNCHRONOUS)

# Query API
query_api = influx_client.query_api()


def get_influx_client() -> InfluxDBClient:
    """Return the global InfluxDB client instance."""
    return influx_client
