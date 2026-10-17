"""
app/workers/command_worker.py

Standalone entrypoint for Command Worker.
Publishes queued commands via MQTT QoS 1 and consumes command responses from Mosquitto broker (TLS)
updating command status in MySQL with retries, application ACKs, and execution timeouts.
"""

import logging
import threading

from app.database.session import SessionLocal
from app.modules.commands.mqtt.listener import CommandListener
from app.modules.commands.mqtt.command_publisher import CommandPublisher
from app.modules.commands.repositories.command_delivery_repository import CommandDeliveryRepository
from app.modules.commands.services.command_delivery_service import CommandDeliveryService
from app.modules.commands.services.command_response_service import mark_execution_timeouts
from app.workers.heartbeat import WorkerHeartbeat
from app.workers.runtime import WorkerRuntime

logger = logging.getLogger(__name__)


def run_command_worker(stop_event: threading.Event) -> None:
    heartbeat = WorkerHeartbeat("command-worker")
    publisher = CommandPublisher()
    publisher.start()

    response_listener = CommandListener()
    response_listener.start()

    delivery_service = CommandDeliveryService(publisher)

    try:
        logger.info("Command Worker delivery loop & response listener active.")
        while not stop_event.is_set():
            heartbeat.beat()
            db = SessionLocal()
            try:
                commands = CommandDeliveryRepository.get_ready_commands(db, limit=50)
                for command in commands:
                    delivery_service.deliver(db, command)

                mark_execution_timeouts(db)
            except Exception as exc:
                logger.error(f"Error in command worker cycle: {exc}")
            finally:
                db.close()

            stop_event.wait(timeout=1.0)
    finally:
        logger.info("Stopping Command Worker...")
        heartbeat.clear()
        response_listener.stop()
        publisher.stop()


def main():
    runtime = WorkerRuntime()
    runtime.run(
        worker_name="command-worker",
        target=run_command_worker,
    )


if __name__ == "__main__":
    main()
