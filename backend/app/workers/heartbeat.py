"""
app/workers/heartbeat.py

Worker process heartbeat monitoring for LocalIoTCloud.
Periodically registers a key in Redis with a 30-second TTL so that container liveness
and process health can be dynamically evaluated by system health administration tools.
"""

from __future__ import annotations

import logging
import socket
import time

from app.database.redis import get_redis_client

logger = logging.getLogger(__name__)

HEARTBEAT_TTL_SECONDS = 30


class WorkerHeartbeat:
    def __init__(self, service_name: str):
        self.service_name = service_name
        self.hostname = socket.gethostname()

    @property
    def key(self) -> str:
        return f"localiot:worker:{self.service_name}:heartbeat"

    def beat(self) -> None:
        try:
            redis_client = get_redis_client()
            payload = f"{self.hostname}:{int(time.time())}"
            redis_client.setex(self.key, HEARTBEAT_TTL_SECONDS, payload)
        except Exception as exc:
            logger.warning(f"WorkerHeartbeat[{self.service_name}] failed to record beat: {exc}")

    def clear(self) -> None:
        try:
            redis_client = get_redis_client()
            redis_client.delete(self.key)
        except Exception as exc:
            logger.warning(f"WorkerHeartbeat[{self.service_name}] failed to clear beat: {exc}")
