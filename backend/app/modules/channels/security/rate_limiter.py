from datetime import datetime, timezone
import logging

logger = logging.getLogger(__name__)


def check_channel_rate_limit(redis_client, key_id: str, limit: int = 600) -> bool:
    if not redis_client:
        return True

    try:
        now = datetime.now(timezone.utc)
        bucket = now.strftime("%Y%m%d%H%M")
        redis_key = f"rate:channel:{key_id}:{bucket}"

        count = redis_client.incr(redis_key)
        if count == 1:
            redis_client.expire(redis_key, 120)

        return count <= limit
    except Exception as exc:
        logger.warning(f"Channel rate limit Redis check failed: {exc}")
        return True
