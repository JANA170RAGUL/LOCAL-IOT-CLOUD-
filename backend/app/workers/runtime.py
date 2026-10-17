"""
app/workers/runtime.py

Generic worker runtime handling graceful shutdown and signal management
(SIGTERM, SIGINT) for background services in LocalIoTCloud.
"""

import logging
import signal
import sys
import threading
from typing import Callable

logger = logging.getLogger(__name__)


class WorkerRuntime:
    """
    Handles graceful shutdown for long-running LocalIoTCloud worker processes.
    """

    def __init__(self):
        self.stop_event = threading.Event()

    def install_signal_handlers(self) -> None:
        """Installs OS signal handlers for graceful shutdown."""
        try:
            signal.signal(signal.SIGTERM, self._handle_signal)
            signal.signal(signal.SIGINT, self._handle_signal)
        except (ValueError, AttributeError) as err:
            # Signal handling might not be supported in non-main thread or special environments
            logger.warning(f"Could not install signal handlers: {err}")

    def _handle_signal(self, signum, frame):
        sig_name = signal.Signals(signum).name if hasattr(signal, "Signals") else str(signum)
        logger.info(f"Shutdown signal received ({sig_name}). Requesting worker stop...")
        self.stop_event.set()

    def run(
        self,
        worker_name: str,
        target: Callable[[threading.Event], None],
    ) -> None:
        """
        Executes a worker target function with installed signal handlers and error recovery.
        """
        logging.basicConfig(
            level=logging.INFO,
            format=f"%(asctime)s [{worker_name}] [%(levelname)s] %(name)s: %(message)s",
        )

        self.install_signal_handlers()
        logger.info(f"Worker process '{worker_name}' starting...")

        try:
            target(self.stop_event)
        except Exception as exc:
            logger.exception(f"Worker process '{worker_name}' crashed with exception: {exc}")
            sys.exit(1)
        finally:
            logger.info(f"Worker process '{worker_name}' stopped cleanly.")
