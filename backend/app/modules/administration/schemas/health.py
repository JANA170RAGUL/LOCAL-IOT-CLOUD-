from pydantic import BaseModel
from typing import Dict, Any, List

class SystemMetrics(BaseModel):
    cpu_percent: float
    ram_percent: float
    disk_percent: float
    # temperature could be added if available, often unavailable on standard OS without specific drivers

class DatabaseStats(BaseModel):
    db_size_mb: float
    tables: Dict[str, int] # Table name to row count

class CacheStats(BaseModel):
    status: str
    memory_used_mb: float
    total_keys: int

class ServiceStatus(BaseModel):
    name: str
    status: str # "Green", "Yellow", "Red"
    details: str

class SystemHealthResponse(BaseModel):
    metrics: SystemMetrics
    db_stats: DatabaseStats
    cache_stats: CacheStats
    services: List[ServiceStatus]

class BackgroundJobStatus(BaseModel):
    name: str
    status: str # "Running", "Idle", "Error"
