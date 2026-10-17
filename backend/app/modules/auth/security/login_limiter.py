import logging
from app.config.settings import settings
from app.database.redis import get_redis_client

logger = logging.getLogger(__name__)

PREFIX = "auth:login-fail:"


def _key(email: str) -> str:
    return PREFIX + email.strip().lower()


def register_failed_login(email: str) -> int:
    try:
        r = get_redis_client()
        key = _key(email)
        count = r.incr(key)
        if count == 1:
            r.expire(key, settings.login_lock_minutes * 60)
        return int(count)
    except Exception as e:
        logger.warning(f"Redis login rate limiter error (incr): {e}")
        return 1


def clear_failed_logins(email: str) -> None:
    try:
        r = get_redis_client()
        r.delete(_key(email))
    except Exception as e:
        logger.warning(f"Redis login rate limiter error (delete): {e}")


def login_allowed(email: str) -> bool:
    try:
        r = get_redis_client()
        value = r.get(_key(email))
        attempts = int(value) if value else 0
        return attempts < settings.login_max_attempts
    except Exception as e:
        logger.warning(f"Redis login rate limiter error (get): {e}")
        return True
