"""
app/modules/telemetry/services/stream_consumer.py

Redis Stream Consumer Group manager for Telemetry Processing Workers.
Handles consumer identification, stream reading (XREADGROUP), explicit message ACK (XACK),
stale message reclamation (XAUTOCLAIM), and Dead Letter Queue (DLQ) routing.
"""

import json
import logging
import os
import socket
import uuid
from typing import Any, Dict, List, Tuple

from redis.exceptions import ResponseError

from app.config.settings import settings
from app.database.redis import get_redis_client

logger = logging.getLogger(__name__)


def create_consumer_name() -> str:
    """Generates a unique consumer process identifier."""
    hostname = socket.gethostname()
    pid = os.getpid()
    suffix = uuid.uuid4().hex[:8]
    return f"{hostname}-{pid}-{suffix}"


def ensure_telemetry_consumer_group() -> None:
    """Creates the telemetry Redis consumer group if it doesn't already exist."""
    r = get_redis_client()
    try:
        r.xgroup_create(
            name=settings.telemetry_stream_name,
            groupname=settings.telemetry_consumer_group,
            id="0",
            mkstream=True,
        )
        logger.info(f"Created telemetry consumer group: '{settings.telemetry_consumer_group}'")
    except ResponseError as exc:
        if "BUSYGROUP" not in str(exc):
            raise


class TelemetryStreamConsumer:
    """
    Consumer Group client for durable telemetry stream reading.
    """

    def __init__(self, consumer_name: str | None = None):
        self.redis = get_redis_client()
        self.stream = settings.telemetry_stream_name
        self.group = settings.telemetry_consumer_group
        self.consumer = consumer_name or create_consumer_name()

        ensure_telemetry_consumer_group()
        logger.info(f"TelemetryStreamConsumer initialized ({self.consumer})")

    def read(self) -> List[Tuple[str, Dict[str, Any]]]:
        """
        Reads new unacknowledged stream messages for this consumer group.
        Returns a list of (message_id, envelope_dict).
        """
        results = self.redis.xreadgroup(
            groupname=self.group,
            consumername=self.consumer,
            streams={self.stream: ">"},
            count=settings.telemetry_read_count,
            block=settings.telemetry_block_ms,
        )

        messages = []
        for _, stream_messages in results or []:
            if isinstance(stream_messages, (list, tuple)):
                for item in stream_messages:
                    if isinstance(item, (list, tuple)) and len(item) == 2:
                        message_id, fields = item
                        if isinstance(message_id, bytes):
                            message_id = message_id.decode("utf-8")

                        if isinstance(fields, dict):
                            data = fields.get(b"data") if b"data" in fields else fields.get("data")
                            if isinstance(data, bytes):
                                data = data.decode("utf-8")

                            if not data or not isinstance(data, str):
                                logger.warning(f"Telemetry stream message {message_id} missing payload data.")
                                continue

                            try:
                                envelope = json.loads(data)
                                messages.append((str(message_id), envelope))
                            except Exception as err:
                                logger.error(f"Failed parsing json envelope for message {message_id}: {err}")

        return messages

    def acknowledge(self, message_id: str) -> None:
        """Issues XACK for a successfully processed message."""
        self.redis.xack(self.stream, self.group, message_id)

    def claim_stale(self, count: int = 50) -> List[Tuple[str, Dict[str, Any]]]:
        """
        Reclaims idle pending messages (> TELEMETRY_PENDING_IDLE_MS) using XAUTOCLAIM.
        """
        try:
            result = self.redis.xautoclaim(
                name=self.stream,
                groupname=self.group,
                consumername=self.consumer,
                min_idle_time=settings.telemetry_pending_idle_ms,
                start_id="0-0",
                count=count,
            )

            if not result or not isinstance(result, (list, tuple)) or len(result) < 2:
                return []

            raw_messages = result[1]
            messages = []
            if isinstance(raw_messages, (list, tuple)):
                for item in raw_messages:
                    if isinstance(item, (list, tuple)) and len(item) == 2:
                        message_id, fields = item
                        if isinstance(message_id, bytes):
                            message_id = message_id.decode("utf-8")

                        if isinstance(fields, dict):
                            data = fields.get(b"data") if b"data" in fields else fields.get("data")
                            if isinstance(data, bytes):
                                data = data.decode("utf-8")

                            if not data or not isinstance(data, str):
                                continue

                            try:
                                envelope = json.loads(data)
                                messages.append((str(message_id), envelope))
                            except Exception:
                                pass

            return messages
        except Exception as exc:
            logger.warning(f"XAUTOCLAIM failed or not supported by Redis version: {exc}")
            return []

    def increment_failure(self, message_id: str) -> int:
        """Increments and returns the failure counter for a specific message_id."""
        key = f"localiot:telemetry:failures:{message_id}"
        count = self.redis.incr(key)
        self.redis.expire(key, 86400)
        return int(count)

    def clear_failure(self, message_id: str) -> None:
        """Deletes the failure counter for a message_id."""
        self.redis.delete(f"localiot:telemetry:failures:{message_id}")

    def move_to_dlq(self, message_id: str, envelope: Dict[str, Any], error_msg: str) -> None:
        """
        Appends a poison message to the Dead Letter Queue (DLQ) stream and ACKs original.
        """
        dlq_fields = {
            "original_message_id": str(message_id),
            "data": json.dumps(envelope, default=str),
            "error": str(error_msg)[:2000],
        }
        self.redis.xadd(name=settings.telemetry_dlq_stream, fields=dlq_fields)
        self.acknowledge(message_id)
        self.clear_failure(message_id)
        logger.error(f"Moved telemetry message {message_id} to DLQ stream: {settings.telemetry_dlq_stream}")
