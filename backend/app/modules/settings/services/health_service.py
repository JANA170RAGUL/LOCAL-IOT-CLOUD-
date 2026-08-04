import psutil
from typing import Dict, Any
from app.modules.settings.schemas.health import HealthStatusResponse, SystemMetrics, ServiceHealth

class HealthService:
    def get_system_metrics(self) -> SystemMetrics:
        return SystemMetrics(
            cpu_percent=psutil.cpu_percent(interval=0.1),
            memory_percent=psutil.virtual_memory().percent,
            disk_percent=psutil.disk_usage('/').percent
        )

    def get_service_health(self) -> HealthStatusResponse:
        # For sprint 16, we mock the services but fetch real system metrics
        services = [
            ServiceHealth(name="MySQL", status="up", details={"message": "Connected"}),
            ServiceHealth(name="Redis", status="up", details={"message": "Connected"}),
            ServiceHealth(name="InfluxDB", status="up", details={"message": "Connected"}),
            ServiceHealth(name="MQTT", status="up", details={"message": "Connected"})
        ]

        system = self.get_system_metrics()

        return HealthStatusResponse(
            overall_status="healthy",
            system=system,
            services=services
        )
