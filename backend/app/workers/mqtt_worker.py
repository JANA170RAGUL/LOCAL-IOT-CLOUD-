"""
app/workers/mqtt_worker.py

Standalone entrypoint for Mosquitto MQTT Ingestion Worker.
Subscribes to device telemetry topics on Mosquitto broker (port 8883 / TLS) and enqueues to Redis.
"""

import logging
import time
import threading

from app.workers.heartbeat import WorkerHeartbeat
from app.workers.runtime import WorkerRuntime
from app.modules.telemetry.services.mqtt_listener import MQTTListener

logger = logging.getLogger(__name__)


def run_mqtt_worker(stop_event: threading.Event) -> None:
    heartbeat = WorkerHeartbeat("mqtt-worker")
    listener = MQTTListener()
    try:
        listener.start()
        logger.info("MQTT Ingestion Listener active.")
        while not stop_event.is_set():
            heartbeat.beat()
            stop_event.wait(timeout=1.0)
    finally:
        logger.info("Stopping MQTT Ingestion Listener...")
        heartbeat.clear()
        listener.stop()


def main():
    runtime = WorkerRuntime()
    runtime.run(
        worker_name="mqtt-worker",
        target=run_mqtt_worker,
    )


if __name__ == "__main__":
    main()
