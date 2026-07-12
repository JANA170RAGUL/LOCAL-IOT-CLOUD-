"""
app/modules/telemetry/services/telemetry_worker.py

Background processor worker thread.
Pulls queued telemetry raw messages from Redis, normalizes/calibrates them
using MySQL resolver metadata, batch writes to InfluxDB, and publishes
to live Redis pub/sub channels for real-time WebSocket distribution.
"""

import json
import logging
import threading
import time

from sqlalchemy.orm import sessionmaker

from app.database.connection import engine
from app.database.redis import get_redis_client
from app.modules.telemetry.services.influx_writer import InfluxWriter
from app.modules.telemetry.services.processing_engine import ProcessingEngine
from app.modules.telemetry.services.queue_manager import QueueManager

logger = logging.getLogger(__name__)


class TelemetryWorker:
    """
    Worker daemon thread polling the Redis telemetry queue.
    Processes, normalizes, and flushes data to InfluxDB and PubSub.
    """

    def __init__(self, poll_interval_sec: float = 0.5, batch_size: int = 100):
        self.poll_interval_sec = poll_interval_sec
        self.batch_size = batch_size

        # Configure MySQL session factory
        self.SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

        self._thread = None
        self._stop_event = threading.Event()

    def start(self) -> None:
        """Start the worker thread."""
        logger.info("Starting Telemetry Worker thread...")
        self._stop_event.clear()
        self._thread = threading.Thread(target=self._run, daemon=True)
        self._thread.start()

    def stop(self) -> None:
        """Sign and stop the worker loop."""
        logger.info("Stopping Telemetry Worker...")
        self._stop_event.set()
        if self._thread:
            self._thread.join(timeout=5.0)
        logger.info("Telemetry Worker stopped.")

    def _run(self) -> None:
        """Continuous polling loop."""
        while not self._stop_event.is_set():
            try:
                self._process_cycle()
            except Exception as e:
                logger.error(f"Error in Telemetry Worker execution cycle: {e}", exc_info=True)

            # Simple adaptive sleep: if queue was empty, sleep full interval
            time.sleep(self.poll_interval_sec)

    def _process_cycle(self) -> None:
        """Fetch batch, process inside transaction, write to InfluxDB and PubSub."""
        raw_envelopes = QueueManager.dequeue_batch(batch_size=self.batch_size)
        if not raw_envelopes:
            return

        db = self.SessionLocal()
        processed_records = []
        r = get_redis_client()

        try:
            for env in raw_envelopes:
                try:
                    payload = env["payload"]
                    gateway_ctx = env.get("gateway_ctx")

                    # Process and calibrate using MySQL metadata
                    normalized = ProcessingEngine.process(
                        db,
                        raw_payload=payload,
                        gateway_ctx=gateway_ctx,
                    )

                    processed_records.append(normalized)

                    # Publish normalized data to Redis PubSub for WebSockets
                    # Channel: telemetry:stream:{device_id}
                    device_id = normalized["device_id"]
                    pubsub_msg = {
                        "sensor_code": normalized["sensor_code"],
                        "sensor_type": normalized["sensor_type"],
                        "data_type": normalized["data_type"],
                        "raw_value": normalized["raw_value"],
                        "value": normalized["value"],
                        "timestamp": normalized["timestamp"].isoformat(),
                    }
                    r.publish(f"telemetry:stream:{device_id}", json.dumps(pubsub_msg))

                    # Run Rule Engine evaluation
                    try:
                        from app.modules.rules.engine.runner import RuleEngineRunner
                        RuleEngineRunner.evaluate_and_trigger(db, normalized)
                    except Exception as re_err:
                        logger.error(f"Rule Engine failed to evaluate record: {re_err}")

                except Exception as e:
                    logger.error(f"Error processing item in worker: {e}")
                    # Continue processing other items in the batch

            # Bulk write point metrics to InfluxDB
            if processed_records:
                InfluxWriter.write_batch(processed_records)

        finally:
            db.close()
