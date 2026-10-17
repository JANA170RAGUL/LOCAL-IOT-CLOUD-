"""
app/core/readiness.py

Dependency readiness checks for LocalIoTCloud platform.
Individually checks MySQL, Redis, and InfluxDB to determine if the application is ready
to serve traffic without logging sensitive credentials or secrets on failure.
"""

from __future__ import annotations

import logging
from sqlalchemy import text

from app.database.session import SessionLocal
from app.database.redis import get_redis_client
from app.database.influx import get_influx_client

logger = logging.getLogger(__name__)


def check_mysql() -> tuple[bool, str | None]:
    db = SessionLocal()
    try:
        db.execute(text("SELECT 1"))
        return True, None
    except Exception as exc:
        logger.warning(f"MySQL readiness check failed: {exc}")
        return False, str(exc)
    finally:
        db.close()


def check_redis() -> tuple[bool, str | None]:
    try:
        redis_client = get_redis_client()
        if redis_client.ping():
            return True, None
        return False, "Redis PING failed"
    except Exception as exc:
        logger.warning(f"Redis readiness check failed: {exc}")
        return False, str(exc)


def check_influx() -> tuple[bool, str | None]:
    try:
        client = get_influx_client()
        health = client.health()
        if health.status == "pass":
            return True, None
        return False, f"Influx health status={health.status}"
    except Exception as exc:
        logger.warning(f"Influx readiness check failed: {exc}")
        return False, str(exc)


def check_mqtt() -> tuple[bool, str | None]:
    import socket
    from app.config.settings import settings
    try:
        s = socket.create_connection(
            (settings.mqtt_host, settings.mqtt_effective_port),
            timeout=2.0
        )
        s.close()
        return True, None
    except Exception as exc:
        logger.warning(f"MQTT socket check failed: {exc}")
        return False, str(exc)

