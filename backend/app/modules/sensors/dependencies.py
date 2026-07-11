"""
app/modules/sensors/dependencies.py

FastAPI Depends() helpers scoped to the Sensor module.
"""

from __future__ import annotations

from app.modules.sensors.services.sensor_service import SensorService


def get_sensor_service() -> SensorService:
    """Provide a SensorService instance for FastAPI dependency injection."""
    return SensorService()
