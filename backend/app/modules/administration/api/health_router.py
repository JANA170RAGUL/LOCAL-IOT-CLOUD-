from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import text
import psutil
import redis

from app.database.session import get_db, engine
from app.core.auth import require_permission
from app.config.settings import settings

from app.modules.administration.schemas.health import (
    SystemHealthResponse,
    SystemMetrics,
    DatabaseStats,
    CacheStats,
    ServiceStatus,
    BackgroundJobStatus
)

router = APIRouter(prefix="/admin", tags=["Administration - System Health"])
admin_dep = [Depends(require_permission("system:admin"))]

def check_redis() -> CacheStats:
    try:
        # Assuming Redis is used, we connect using settings
        r = redis.Redis(host=settings.redis_host, port=settings.redis_port, db=settings.redis_db, password=settings.redis_password)
        info = r.info()
        return CacheStats(
            status="Online",
            memory_used_mb=info.get("used_memory", 0) / (1024 * 1024),
            total_keys=info.get("db0", {}).get("keys", 0) if "db0" in info else 0
        )
    except Exception:
        return CacheStats(status="Offline", memory_used_mb=0, total_keys=0)

def check_database() -> DatabaseStats:
    # Get DB size and table row counts using raw SQL (SQLite/MySQL compatible as best effort)
    # For LocalIoTCloud, we are using MySQL/SQLite. 
    try:
        # Simplistic approach that works mostly with MySQL/SQLite
        with engine.connect() as conn:
            # Note: getting DB size universally is hard. We will mock or try to get file size for SQLite, or information_schema for MySQL
            if engine.url.drivername == "sqlite":
                import os
                db_path = engine.url.database
                size = os.path.getsize(db_path) / (1024 * 1024) if db_path and os.path.exists(db_path) else 0
                return DatabaseStats(db_size_mb=size, tables={"users": 0}) # Mocking table count for sqlite
            else:
                # MySQL
                result = conn.execute(text("SELECT table_name, table_rows FROM information_schema.tables WHERE table_schema = DATABASE()"))
                tables = {row[0]: row[1] or 0 for row in result}
                
                size_result = conn.execute(text("SELECT SUM(data_length + index_length) FROM information_schema.tables WHERE table_schema = DATABASE()"))
                size = size_result.scalar() or 0
                return DatabaseStats(db_size_mb=size / (1024 * 1024), tables=tables)
    except Exception:
        return DatabaseStats(db_size_mb=0, tables={})

@router.get("/system-health", response_model=SystemHealthResponse, dependencies=admin_dep, summary="22.6 System Health")
def get_system_health():
    # CPU, RAM, Disk
    metrics = SystemMetrics(
        cpu_percent=psutil.cpu_percent(interval=0.1),
        ram_percent=psutil.virtual_memory().percent,
        disk_percent=psutil.disk_usage('/').percent
    )
    
    db_stats = check_database()
    cache_stats = check_redis()
    
    # Mocking services
    services = [
        ServiceStatus(name="FastAPI", status="Green", details="Running"),
        ServiceStatus(name="MySQL", status="Green" if db_stats.tables else "Red", details=f"Size: {db_stats.db_size_mb:.2f} MB"),
        ServiceStatus(name="Redis", status="Green" if cache_stats.status == "Online" else "Red", details=f"Mem: {cache_stats.memory_used_mb:.2f} MB"),
        ServiceStatus(name="InfluxDB", status="Yellow", details="Simulated - Not fully implemented"),
        ServiceStatus(name="MQTT", status="Green", details="Simulated"),
        ServiceStatus(name="Email", status="Green", details="Simulated Mock")
    ]
    
    return SystemHealthResponse(
        metrics=metrics,
        db_stats=db_stats,
        cache_stats=cache_stats,
        services=services
    )

@router.get("/background-jobs", response_model=list[BackgroundJobStatus], dependencies=admin_dep, summary="22.5 Background Jobs")
def get_background_jobs():
    # Since background workers are run in main.py via threads, we can mock their status here
    # In a real app we'd have a global registry or check thread availability
    return [
        BackgroundJobStatus(name="Telemetry Worker", status="Running"),
        BackgroundJobStatus(name="MQTT Listener", status="Running"),
        BackgroundJobStatus(name="Notification Worker", status="Running"),
        BackgroundJobStatus(name="Analytics Worker", status="Idle"),
        BackgroundJobStatus(name="Reports Worker", status="Idle"),
        BackgroundJobStatus(name="Backup Worker", status="Idle"),
    ]

@router.post("/cache-flush", dependencies=admin_dep, summary="22.8 Cache Manager (Flush)")
def flush_cache():
    try:
        r = redis.Redis(host=settings.redis_host, port=settings.redis_port, db=settings.redis_db, password=settings.redis_password)
        r.flushdb()
        return {"message": "Cache flushed successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to flush cache: {str(e)}")
