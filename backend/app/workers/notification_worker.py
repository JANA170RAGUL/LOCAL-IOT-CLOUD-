"""
app/workers/notification_worker.py

Standalone entrypoint for Notification Processing Worker.
Polls MySQL for PENDING alerts/email/SMS notifications and processes sending.
"""

import logging
import threading

from app.workers.heartbeat import WorkerHeartbeat
from app.workers.runtime import WorkerRuntime
from app.modules.notifications.services.worker import NotificationWorker

logger = logging.getLogger(__name__)


def run_notification_worker(stop_event: threading.Event) -> None:
    heartbeat = WorkerHeartbeat("notification-worker")
    worker = NotificationWorker()
    logger.info("Notification Processing Worker active.")
    try:
        worker.run(stop_event=stop_event, heartbeat=heartbeat)
    finally:
        heartbeat.clear()


def main():
    runtime = WorkerRuntime()
    runtime.run(
        worker_name="notification-worker",
        target=run_notification_worker,
    )


if __name__ == "__main__":
    main()
