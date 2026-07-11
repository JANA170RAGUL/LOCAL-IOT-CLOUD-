"""
app/core/logging.py

Loguru-based logging configuration for the LocalIoTCloud platform.

Responsibilities
----------------
- Configure Loguru sinks (stderr + rotating file).
- Intercept stdlib ``logging`` calls (from SQLAlchemy, uvicorn, etc.)
  so everything flows through Loguru.
- Expose ``setup_logging()`` to be called once during app startup.
- Expose ``get_logger()`` as a thin wrapper for module-level loggers.

Usage
-----
    # In any module:
    from app.core.logging import get_logger
    logger = get_logger(__name__)
    logger.info("Device {id} connected.", id=device_id)

    # In main.py / lifespan:
    from app.core.logging import setup_logging
    setup_logging()
"""

from __future__ import annotations

import logging
import sys
from pathlib import Path
from typing import TYPE_CHECKING

from loguru import logger

from app.config.settings import settings

if TYPE_CHECKING:
    from loguru import Logger

# ---------------------------------------------------------------------------
# Stdlib → Loguru bridge
# ---------------------------------------------------------------------------

class _InterceptHandler(logging.Handler):
    """
    Routes all stdlib ``logging`` records into Loguru.
    This ensures that SQLAlchemy, uvicorn, httpx, etc. all appear in the
    same structured stream as application logs.
    """

    def emit(self, record: logging.LogRecord) -> None:
        # Map stdlib level name → Loguru level
        try:
            level: str | int = logger.level(record.levelname).name
        except ValueError:
            level = record.levelno

        # Walk up the call stack to find the real caller
        frame, depth = sys._getframe(6), 6
        while frame and frame.f_code.co_filename == logging.__file__:
            frame = frame.f_back  # type: ignore[assignment]
            depth += 1

        logger.opt(depth=depth, exception=record.exc_info).log(
            level, record.getMessage()
        )


# ---------------------------------------------------------------------------
# Log format
# ---------------------------------------------------------------------------

_CONSOLE_FORMAT = (
    "<green>{time:YYYY-MM-DD HH:mm:ss.SSS}</green> | "
    "<level>{level: <8}</level> | "
    "<cyan>{name}</cyan>:<cyan>{line}</cyan> | "
    "<level>{message}</level>"
)

_FILE_FORMAT = (
    "{time:YYYY-MM-DD HH:mm:ss.SSS} | "
    "{level: <8} | "
    "{name}:{line} | "
    "{message}"
)

# ---------------------------------------------------------------------------
# Setup
# ---------------------------------------------------------------------------

def setup_logging() -> None:
    """
    Configure Loguru and intercept all stdlib logging.
    Call this **once** at application startup, before any other imports
    that might trigger log output.

    Sinks configured
    ----------------
    1. stderr   – human-readable coloured output (dev) or plain (prod)
    2. log file – rotating file with configurable retention
    """
    # Remove Loguru's default handler
    logger.remove()

    # --- Sink 1: Console ---
    logger.add(
        sys.stderr,
        level=settings.log_level,
        format=_CONSOLE_FORMAT,
        colorize=settings.is_debug,   # colours in dev, plain in prod
        backtrace=settings.is_debug,
        diagnose=settings.is_debug,
    )

    # --- Sink 2: Rotating file ---
    log_path = Path(settings.log_file)
    log_path.parent.mkdir(parents=True, exist_ok=True)

    logger.add(
        str(log_path),
        level=settings.log_level,
        format=_FILE_FORMAT,
        rotation=settings.log_rotation,    # e.g. "10 MB"
        retention=settings.log_retention,  # e.g. "30 days"
        compression="zip",
        enqueue=True,           # thread-safe async write
        backtrace=True,
        diagnose=False,         # never write locals to file (security)
        encoding="utf-8",
    )

    # --- Intercept stdlib logging ---
    logging.basicConfig(handlers=[_InterceptHandler()], level=0, force=True)

    # Silence noisy third-party loggers in production
    if settings.is_production:
        for noisy in ("sqlalchemy.engine", "httpx", "httpcore"):
            logging.getLogger(noisy).setLevel(logging.WARNING)

    logger.info(
        "Logging configured  level={level}  file={file}  env={env}",
        level=settings.log_level,
        file=settings.log_file,
        env=settings.app_env,
    )


# ---------------------------------------------------------------------------
# Module-level logger factory
# ---------------------------------------------------------------------------

def get_logger(name: str) -> "Logger":
    """
    Return a Loguru logger bound to ``name`` (typically ``__name__``).

    The bound name appears in every log record, making it easy to filter
    by module in log aggregation tools.

    Example
    -------
        logger = get_logger(__name__)
        logger.debug("Fetching device {id}", id=device_id)
    """
    return logger.bind(name=name)
