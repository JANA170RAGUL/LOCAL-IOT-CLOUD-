"""
app/modules/telemetry/services/telemetry_worker.py

Durable Telemetry Worker.
Consumes telemetry events from Redis Stream consumer group ('localiot:telemetry'),
normalizes/calibrates metrics using MySQL metadata, writes to InfluxDB, evaluates rules,
publishes live WebSockets, and acknowledges ('xack') messages upon completion.
Includes automatic stale pending message recovery (xautoclaim) and Dead Letter Queue (DLQ) routing.
"""

import json
import logging
import threading
import time
from typing import Any, Dict, List

from sqlalchemy.orm import sessionmaker

from app.config.settings import settings
from app.database.connection import engine
from app.database.redis import get_redis_client
from app.modules.telemetry.services.influx_writer import InfluxWriter
from app.modules.telemetry.services.processing_engine import ProcessingEngine
from app.modules.telemetry.services.stream_consumer import TelemetryStreamConsumer

logger = logging.getLogger(__name__)


class TelemetryWorker:
    """
    Worker daemon processing telemetry from Redis Stream using Consumer Groups.
    Ensures at-least-once durable delivery with explicit XACK and DLQ protection.
    """

    def __init__(self, poll_interval_sec: float = 0.5, batch_size: int = 100):
        self.poll_interval_sec = poll_interval_sec
        self.batch_size = batch_size

        self.SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
        self.consumer = TelemetryStreamConsumer()

        self._thread = None
        self._stop_event = threading.Event()

    def start(self) -> None:
        """Start the worker thread."""
        logger.info("Starting Telemetry Worker thread...")
        self._stop_event.clear()
        self._thread = threading.Thread(target=self._run, daemon=True)
        self._thread.start()

    def stop(self) -> None:
        """Signal and stop the worker loop."""
        logger.info("Stopping Telemetry Worker...")
        self._stop_event.set()
        if self._thread:
            self._thread.join(timeout=5.0)
        logger.info("Telemetry Worker stopped.")

    def run(self, stop_event: threading.Event | None = None, heartbeat: Any | None = None) -> None:
        """Continuous stream reading loop with periodic stale reclamation and heartbeats."""
        event = stop_event or self._stop_event
        logger.info("Telemetry Stream Processing loop active.")

        # Reclaim any pending messages idle from previous crashes/restarts
        self._recover_stale_messages()
        last_recovery_time = time.monotonic()

        while not event.is_set():
            if heartbeat:
                heartbeat.beat()
            try:
                # Periodically reclaim stale idle messages every 30s
                now = time.monotonic()
                if now - last_recovery_time >= 30.0:
                    self._recover_stale_messages()
                    last_recovery_time = now

                messages = self.consumer.read()
                if messages:
                    for msg_id, envelope in messages:
                        if event.is_set():
                            break
                        self._process_single_message(msg_id, envelope)
                else:
                    event.wait(timeout=self.poll_interval_sec)

            except Exception as exc:
                logger.error(f"Error in Telemetry Worker execution loop: {exc}", exc_info=True)
                event.wait(timeout=1.0)

    def _run(self) -> None:
        """Worker thread entrypoint."""
        self.run(stop_event=self._stop_event)

    def _recover_stale_messages(self) -> None:
        """Reclaims and re-processes pending messages idle longer than TELEMETRY_PENDING_IDLE_MS."""
        try:
            stale_messages = self.consumer.claim_stale(count=settings.telemetry_read_count)
            if stale_messages:
                logger.warning(f"Reclaimed {len(stale_messages)} stale pending telemetry messages.")
                for msg_id, envelope in stale_messages:
                    self._process_single_message(msg_id, envelope)
        except Exception as err:
            logger.error(f"Error recovering stale telemetry stream messages: {err}")

    def _process_single_message(self, message_id: str, envelope: Dict[str, Any]) -> bool:
        """
        Processes a single telemetry envelope.
        On success: writes metric, publishes PubSub/rules, and issues XACK.
        On failure: increments retry counter and routes to DLQ if max retries exceeded.
        """
        db = self.SessionLocal()
        r = get_redis_client()

        try:
            payload = envelope.get("payload", {})
            gateway_ctx = envelope.get("gateway_ctx")
            event_id = envelope.get("event_id")

            # 1. Normalize and calibrate using MySQL metadata
            normalized = ProcessingEngine.process(
                db,
                raw_payload=payload,
                gateway_ctx=gateway_ctx,
            )

            # Preserve event_id in normalized record for deterministic tracking
            if event_id:
                normalized["event_id"] = event_id

            # 2. Write point metric to InfluxDB
            InfluxWriter.write_batch([normalized])

            # 3. Publish normalized data to Redis PubSub for WebSockets
            device_id = normalized["device_id"]
            pubsub_msg = {
                "sensor_code": normalized["sensor_code"],
                "sensor_type": normalized["sensor_type"],
                "data_type": normalized["data_type"],
                "raw_value": normalized["raw_value"],
                "value": normalized["value"],
                "timestamp": normalized["timestamp"].isoformat(),
                "event_id": event_id,
            }
            r.publish(f"telemetry:stream:{device_id}", json.dumps(pubsub_msg))

            # 4. Cache latest & history points in Redis
            try:
                r.set(f"telemetry:latest:{device_id}:{normalized['sensor_code']}", json.dumps(pubsub_msg))
                r.lpush(f"telemetry:history:{device_id}:{normalized['sensor_code']}", json.dumps(pubsub_msg))
                r.ltrim(f"telemetry:history:{device_id}:{normalized['sensor_code']}", 0, 99)
            except Exception as cache_err:
                logger.warning(f"Failed caching telemetry in Redis: {cache_err}")

            # 5. Evaluate Rule Engine
            try:
                from app.modules.rules.engine.runner import RuleEngineRunner
                RuleEngineRunner.evaluate_and_trigger(db, normalized)
            except Exception as re_err:
                logger.error(f"Rule Engine failed to evaluate record: {re_err}")

            # 6. ACK ONLY AFTER SUCCESSFUL PROCESSING
            self.consumer.acknowledge(message_id)
            self.consumer.clear_failure(message_id)
            logger.debug(f"Telemetry message {message_id} (event: {event_id}) processed and ACKed.")
            return True

        except Exception as exc:
            logger.error(f"Failed processing telemetry stream message {message_id}: {exc}")
            attempts = self.consumer.increment_failure(message_id)

            if attempts >= settings.telemetry_max_retries:
                logger.error(f"Message {message_id} reached max retries ({attempts}). Moving to DLQ.")
                self.consumer.move_to_dlq(message_id, envelope, str(exc))
            else:
                logger.warning(f"Message {message_id} left PENDING for retry (attempt {attempts}/{settings.telemetry_max_retries}).")

            return False

        finally:
            db.close()
