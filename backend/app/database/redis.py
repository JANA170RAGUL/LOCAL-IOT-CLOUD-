"""
app/database/redis.py

Redis connection client.
Used for caching, session checks, and telemetry buffering queues.
"""

import redis

from app.config.settings import settings

# Initialize Redis connection pool
connection_pool = redis.ConnectionPool(
    host=settings.redis_host,
    port=settings.redis_port,
    password=settings.redis_password or None,
    db=settings.redis_db,
    max_connections=settings.redis_max_connections,
    decode_responses=True,  # Automatically decode response bytes to strings
)

redis_client: redis.Redis = redis.Redis(connection_pool=connection_pool)


def get_redis_client() -> redis.Redis:
    """Return the global Redis client instance."""
    return redis_client
