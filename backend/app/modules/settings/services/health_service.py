"""
app/modules/settings/services/health_service.py

Real infrastructure health service querying active MySQL, Redis, InfluxDB, and MQTT services.
"""

import psutil
from typing import Dict, Any
from app.modules.settings.schemas.health import HealthStatusResponse, SystemMetrics, ServiceHealth
from app.core.readiness import check_mysql, check_redis, check_influx, check_mqtt


class HealthService:
    def get_system_metrics(self) -> SystemMetrics:
        return SystemMetrics(
            cpu_percent=psutil.cpu_percent(interval=0.1),
            memory_percent=psutil.virtual_memory().percent,
            disk_percent=psutil.disk_usage("/").percent,
        )

    def get_service_health(self) -> HealthStatusResponse:
        mysql_ok, mysql_err = check_mysql()
        redis_ok, redis_err = check_redis()
        influx_ok, influx_err = check_influx()
        mqtt_ok, mqtt_err = check_mqtt()

        services = [
            ServiceHealth(
                name="MySQL",
                status="up" if mysql_ok else "down",
                details={"message": "Connected" if mysql_ok else f"Error: {mysql_err}"},
            ),
            ServiceHealth(
                name="Redis",
                status="up" if redis_ok else "down",
                details={"message": "Connected" if redis_ok else f"Error: {redis_err}"},
            ),
            ServiceHealth(
                name="InfluxDB",
                status="up" if influx_ok else "down",
                details={"message": "Connected" if influx_ok else f"Error: {influx_err}"},
            ),
            ServiceHealth(
                name="MQTT",
                status="up" if mqtt_ok else "down",
                details={"message": "Connected" if mqtt_ok else f"Error: {mqtt_err}"},
            ),
        ]

        system = self.get_system_metrics()
        all_ok = all([mysql_ok, redis_ok, influx_ok, mqtt_ok])

        return HealthStatusResponse(
            overall_status="healthy" if all_ok else "degraded",
            system=system,
            services=services,
        )
