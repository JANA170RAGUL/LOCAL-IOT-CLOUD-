from pydantic import BaseModel
from typing import Dict, Any, List

class ServiceHealth(BaseModel):
    name: str
    status: str  # "up", "down", "degraded"
    details: Dict[str, Any]

class SystemMetrics(BaseModel):
    cpu_percent: float
    memory_percent: float
    disk_percent: float

class HealthStatusResponse(BaseModel):
    overall_status: str
    system: SystemMetrics
    services: List[ServiceHealth]
