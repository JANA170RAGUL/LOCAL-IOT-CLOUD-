"""
app/workers/telemetry_worker.py

Standalone entrypoint for Telemetry Processing Worker.
Pulls queued telemetry messages from Redis, normalizes & calibrates data using MySQL metadata,
bulk writes to InfluxDB, evaluates rules, and publishes to live Redis pub/sub streams.
"""

import logging
import threading

from app.workers.heartbeat import WorkerHeartbeat
from app.workers.runtime import WorkerRuntime
from app.modules.telemetry.services.telemetry_worker import TelemetryWorker

logger = logging.getLogger(__name__)


def run_telemetry_worker(stop_event: threading.Event) -> None:
    heartbeat = WorkerHeartbeat("telemetry-worker")
    worker = TelemetryWorker()
    logger.info("Telemetry Processing Worker active.")
    try:
        worker.run(stop_event=stop_event, heartbeat=heartbeat)
    finally:
        heartbeat.clear()


def main():
    runtime = WorkerRuntime()
    runtime.run(
        worker_name="telemetry-worker",
        target=run_telemetry_worker,
    )


if __name__ == "__main__":
    main()
