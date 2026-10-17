"""
app/modules/licensing/services/telemetry_limiter.py

Centralized telemetry rate enforcement for HTTP and MQTT ingestion.
Uses license policy snapshot and Redis pipeline windowing.
"""

from __future__ import annotations

import logging
from sqlalchemy.orm import Session

from app.database.redis import get_redis_client
from app.database.session import SessionLocal
from app.modules.licensing.features import LicenseFeature
from app.modules.licensing.policy.models import LicenseMode
from app.modules.licensing.services.license_policy import license_policy

logger = logging.getLogger(__name__)


def check_telemetry_limits(redis_client=None, db: Session | None = None) -> bool:
    """
    Evaluates telemetry rate limit against the authoritative LicensePolicyService.
    Returns True if ingestion is allowed, False if rate limit is exceeded or telemetry is disabled.
    """
    close_db = False
    if db is None:
        db = SessionLocal()
        close_db = True

    try:
        snapshot = license_policy.get_snapshot(db)
    finally:
        if close_db:
            db.close()

    # Allowed in RESTRICTED / GRACE / VALID modes for existing registered devices
    if snapshot.mode in {LicenseMode.INVALID, LicenseMode.CLOCK_ROLLBACK}:
        return False

    value = snapshot.features.get(LicenseFeature.TELEMETRY_RATE.value)
    if type(value) is not int:
        return False

    if value == -1:
        return True

    if value <= 0:
        return False

    r = redis_client or get_redis_client()
    try:
        redis_time = r.time()
        current_second = int(redis_time[0])
        key = f"license:telemetry-rate:{current_second}"

        pipe = r.pipeline()
        pipe.incr(key)
        pipe.expire(key, 2)
        results = pipe.execute()
        count = results[0]

        if count > value:
            logger.warning(f"Telemetry rate limit exceeded ({count}/{value} msg/sec).")
            return False
        return True
    except Exception as exc:
        logger.warning(f"Telemetry rate limit evaluation fallback: {exc}")
        return True
