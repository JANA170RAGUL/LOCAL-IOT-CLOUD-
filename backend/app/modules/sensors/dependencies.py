"""
app/modules/sensors/dependencies.py

FastAPI ``Depends()`` helpers scoped to the Sensor module.
"""

from __future__ import annotations

# from app.modules.sensors.services.sensor_service import SensorService  # noqa: E501
# Uncomment the import above once the service class is implemented.


def get_sensor_service():  # type: ignore[return]
    """
    Provide a ``SensorService`` instance.
    Uncomment the body once the service class is implemented.
    """
    # return SensorService()
    raise NotImplementedError("SensorService is not yet implemented.")
