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

import shutil
from app.database.redis import get_redis_client


@router.get("/system-health", response_model=SystemHealthResponse, dependencies=admin_dep, summary="22.6 System Health")
def get_system_health():
    # CPU, RAM, Disk
    usage = shutil.disk_usage("/")
    disk_percent = round((usage.used / usage.total) * 100, 2)

    metrics = SystemMetrics(
        cpu_percent=psutil.cpu_percent(interval=0.1),
        ram_percent=psutil.virtual_memory().percent,
        disk_percent=disk_percent,
    )
    
    db_stats = check_database()
    cache_stats = check_redis()
    
    from app.core.readiness import check_influx, check_mqtt
    influx_ok, _ = check_influx()
    mqtt_ok, _ = check_mqtt()
    email_configured = settings.notification_provider == "smtp"

    services = [
        ServiceStatus(name="FastAPI", status="Green", details="Running"),
        ServiceStatus(name="MySQL", status="Green" if db_stats.tables else "Red", details=f"Size: {db_stats.db_size_mb:.2f} MB"),
        ServiceStatus(name="Redis", status="Green" if cache_stats.status == "Online" else "Red", details=f"Mem: {cache_stats.memory_used_mb:.2f} MB"),
        ServiceStatus(name="InfluxDB", status="Green" if influx_ok else "Red", details="Time-Series Engine" if influx_ok else "Unavailable"),
        ServiceStatus(name="MQTT", status="Green" if mqtt_ok else "Red", details="Mosquitto Broker" if mqtt_ok else "Broker Disconnected"),
        ServiceStatus(name="Email", status="Green" if email_configured else "Yellow", details="Configured Notification Gateway" if email_configured else "Unconfigured / Console Provider"),
    ]
    
    return SystemHealthResponse(
        metrics=metrics,
        db_stats=db_stats,
        cache_stats=cache_stats,
        services=services
    )

@router.get("/background-jobs", response_model=list[BackgroundJobStatus], dependencies=admin_dep, summary="22.5 Background Jobs")
def get_background_jobs():
    workers = [
        ("Telemetry Worker", "telemetry-worker"),
        ("MQTT Listener", "mqtt-worker"),
        ("Notification Worker", "notification-worker"),
        ("Command Worker", "command-worker"),
    ]

    statuses = []
    try:
        r = get_redis_client()
        for label, name in workers:
            exists = bool(r.exists(f"localiot:worker:{name}:heartbeat"))
            status = "Running" if exists else "Stopped"
            statuses.append(BackgroundJobStatus(name=label, status=status))
    except Exception:
        for label, _ in workers:
            statuses.append(BackgroundJobStatus(name=label, status="Stopped"))

    # Auxiliary jobs
    statuses.extend([
        BackgroundJobStatus(name="Analytics Worker", status="Idle"),
        BackgroundJobStatus(name="Reports Worker", status="Idle"),
        BackgroundJobStatus(name="Backup Worker", status="Idle"),
    ])

    return statuses

@router.post("/cache-flush", dependencies=admin_dep, summary="22.8 Cache Manager (Flush)")
def flush_cache():
    try:
        r = redis.Redis(host=settings.redis_host, port=settings.redis_port, db=settings.redis_db, password=settings.redis_password)
        r.flushdb()
        return {"message": "Cache flushed successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to flush cache: {str(e)}")
