"""
app/modules/telemetry/services/queue_manager.py

Redis-based Telemetry queue manager.
Buffers raw incoming payloads from MQTT or HTTP to decouple ingestion from storage.
"""

import json
from app.database.redis import get_redis_client

QUEUE_KEY = "telemetry:queue"


class QueueManager:

    @staticmethod
    def enqueue(payload: dict) -> None:
        """Serialize payload to JSON and push to Redis queue."""
        r = get_redis_client()
        r.rpush(QUEUE_KEY, json.dumps(payload))

    @staticmethod
    def dequeue_batch(batch_size: int = 100) -> list[dict]:
        """
        Pop up to `batch_size` elements from the queue.
        Uses a Redis pipeline to perform batch pops atomically and efficiently.
        """
        r = get_redis_client()
        
        # Determine the length of the queue to pop only what is present
        queue_len = r.llen(QUEUE_KEY)
        if not queue_len:
            return []

        pop_count = min(batch_size, queue_len)
        pipe = r.pipeline()
        for _ in range(pop_count):
            pipe.lpop(QUEUE_KEY)
        
        results = pipe.execute()
        
        payloads = []
        for res in results:
            if res:
                try:
                    payloads.append(json.loads(res))
                except json.JSONDecodeError:
                    # Ignore corrupted items
                    pass
        return payloads

    @staticmethod
    def get_length() -> int:
        """Return the current length of the telemetry queue."""
        r = get_redis_client()
        return r.llen(QUEUE_KEY)
