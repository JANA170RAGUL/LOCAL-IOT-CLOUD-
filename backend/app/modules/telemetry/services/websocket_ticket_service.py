"""
app/modules/telemetry/services/websocket_ticket_service.py

Service to issue and consume short-lived one-time WebSocket authentication tickets stored in Redis.
"""

import json
import secrets

from app.database.redis import get_redis_client

TICKET_TTL_SECONDS = 30
TICKET_PREFIX = "telemetry:ws-ticket:"


class WebSocketTicketService:

    @staticmethod
    def create(
        *,
        user_id: str,
        sensor_id: str,
    ) -> str:
        """
        Generates a secure random ticket and stores it in Redis with a 30-second TTL.
        """
        redis = get_redis_client()
        ticket = secrets.token_urlsafe(32)

        payload = {
            "user_id": user_id,
            "sensor_id": sensor_id,
        }

        redis.set(
            f"{TICKET_PREFIX}{ticket}",
            json.dumps(payload),
            ex=TICKET_TTL_SECONDS,
        )

        return ticket

    @staticmethod
    def consume(ticket: str) -> dict | None:
        """
        Atomically fetches and deletes the ticket from Redis.
        Returns the ticket payload if valid, or None if expired/invalid/reused.
        """
        if not ticket:
            return None

        redis = get_redis_client()
        key = f"{TICKET_PREFIX}{ticket}"

        pipe = redis.pipeline()
        pipe.get(key)
        pipe.delete(key)
        results = pipe.execute()
        value = results[0]

        if not value:
            return None

        if isinstance(value, bytes):
            value = value.decode("utf-8")

        try:
            return json.loads(value)
        except Exception:
            return None
