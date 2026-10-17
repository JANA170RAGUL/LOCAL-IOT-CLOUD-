"""
app/modules/telemetry/services/queue_manager.py

Redis Stream Telemetry Queue Manager.
Decouples MQTT/HTTP ingestion from background processing via durable Redis Streams.
"""

import json
import logging
import uuid
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

from app.config.settings import settings
from app.database.redis import get_redis_client

logger = logging.getLogger(__name__)


class QueueManager:
    @staticmethod
    def enqueue(envelope: Dict[str, Any]) -> str:
        """
        Appends telemetry envelope to the durable Redis Stream.
        Ensures envelope contains a unique event_id and received_at timestamp.
        Returns the Redis Stream message ID.
        """
        r = get_redis_client()

        # Build mutable dictionary copy
        envelope_data = dict(envelope)
        envelope_data.setdefault("event_id", str(uuid.uuid4()))
        envelope_data.setdefault("received_at", datetime.now(timezone.utc).isoformat())

        payload = json.dumps(
            envelope_data,
            default=str,
            separators=(",", ":"),
        )

        message_id = r.xadd(
            name=settings.telemetry_stream_name,
            fields={"data": payload, "event_id": envelope_data["event_id"]},
            maxlen=settings.telemetry_stream_maxlen,
            approximate=True,
        )

        if isinstance(message_id, bytes):
            message_id = message_id.decode("utf-8")

        return message_id

    @staticmethod
    def get_length() -> int:
        """Returns current length of the telemetry stream."""
        r = get_redis_client()
        return r.xlen(settings.telemetry_stream_name)

    @staticmethod
    def dequeue_batch(batch_size: int = 100) -> List[Dict[str, Any]]:
        """
        Legacy adapter method for unit test compatibility.
        Reads messages directly using a temporary consumer or stream read.
        """
        r = get_redis_client()
        stream_name = settings.telemetry_stream_name

        stream_len = r.xlen(stream_name)
        if not stream_len:
            # Fallback to checking legacy list key if present
            legacy_len = r.llen("telemetry:queue")
            if legacy_len:
                pipe = r.pipeline()
                for _ in range(min(batch_size, legacy_len)):
                    pipe.lpop("telemetry:queue")
                return [json.loads(x) for x in pipe.execute() if x]
            return []

        # Read range up to batch_size
        results = r.xrange(stream_name, count=min(batch_size, stream_len))
        payloads = []
        for item in results or []:
            if isinstance(item, (list, tuple)) and len(item) == 2:
                _, fields = item
                if isinstance(fields, dict):
                    data = fields.get(b"data") if b"data" in fields else fields.get("data")
                    if isinstance(data, bytes):
                        data = data.decode("utf-8")
                    if data and isinstance(data, str):
                        try:
                            payloads.append(json.loads(data))
                        except Exception:
                            pass
        return payloads
