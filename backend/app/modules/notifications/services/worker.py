from typing import Any
import logging
import threading
import time
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime

from app.database.session import SessionLocal
from app.modules.notifications.repositories.notification_repository import NotificationRepository
from app.modules.settings.services.settings_service import SettingsService

logger = logging.getLogger(__name__)

class NotificationWorker:
    """
    Background worker that polls for PENDING notifications and sends them.
    Reads SMTP settings from the database (via SettingsService).
    """
    def __init__(self, poll_interval: int = 5, max_retries: int = 3):
        self.poll_interval = poll_interval
        self.max_retries = max_retries
        self._stop_event = threading.Event()
        self._thread = None

    def start(self):
        if self._thread is None:
            self._stop_event.clear()
            self._thread = threading.Thread(target=self._run, daemon=True, name="NotificationWorker")
            self._thread.start()
            logger.info("NotificationWorker started.")

    def stop(self):
        if self._thread is not None:
            logger.info("Stopping NotificationWorker...")
            self._stop_event.set()
            self._thread.join()
            self._thread = None
            logger.info("NotificationWorker stopped.")

    def run(self, stop_event: threading.Event = None, heartbeat: Any = None):
        event = stop_event or self._stop_event
        while not event.is_set():
            if heartbeat:
                heartbeat.beat()
            try:
                processed = self._process_queue()
                if not processed:
                    event.wait(timeout=self.poll_interval)
            except Exception as e:
                logger.error(f"Error in NotificationWorker: {e}", exc_info=True)
                event.wait(timeout=1.0)

    def _run(self):
        self.run(stop_event=self._stop_event)

    def _process_queue(self) -> bool:
        # Use a fresh DB session for each poll iteration
        with SessionLocal() as db:
            repo = NotificationRepository(db)
            pending = repo.get_pending(limit=20)
            
            if not pending:
                return False

            # Fetch SMTP settings once per batch
            settings_service = SettingsService(db)
            email_settings = settings_service.get_category_settings("email")
            
            if not email_settings or not email_settings.get("smtpHost"):
                from app.core.environment import demo_data_allowed
                from app.config.settings import settings
                if settings.notification_provider == "console" and demo_data_allowed():
                    self._mock_send_batch(repo, pending)
                else:
                    self._fail_unconfigured_batch(repo, pending)
                return True

            # Real SMTP sending
            self._send_batch(repo, pending, email_settings)
            return True

    def _send_batch(self, repo: NotificationRepository, notifications: list, email_settings: dict):
        host = email_settings.get("smtpHost")
        port = int(email_settings.get("smtpPort", 587))
        user = email_settings.get("username")
        password = email_settings.get("password")
        sender = email_settings.get("senderEmail", "noreply@localiot.com")
        use_tls = email_settings.get("use_tls", True)

        try:
            # Create a single SMTP connection for the batch
            server = smtplib.SMTP(host, port, timeout=10)
            if use_tls:
                server.starttls()
            if user and password:
                server.login(user, password)

            for notification in notifications:
                try:
                    if notification.channel == "EMAIL":
                        msg = MIMEMultipart()
                        msg['From'] = sender
                        msg['To'] = notification.recipient
                        msg['Subject'] = notification.subject
                        msg.attach(MIMEText(notification.body, 'plain'))

                        server.send_message(msg)
                        
                        repo.update_status(notification.id, status="SENT", sent_at=datetime.utcnow())
                        logger.info(f"Email sent successfully to {notification.recipient} (ID: {notification.id})")
                    else:
                        # Future channels (e.g. SMS)
                        repo.update_status(notification.id, status="FAILED", error_message=f"Unsupported channel: {notification.channel}")
                except Exception as e:
                    self._handle_send_error(repo, notification, str(e))

            server.quit()
        except Exception as e:
            logger.error(f"SMTP Connection Error: {e}")
            for notification in notifications:
                self._handle_send_error(repo, notification, f"SMTP Connection Error: {e}")

    def _mock_send_batch(self, repo: NotificationRepository, notifications: list):
        """Development-only console logging when ALLOW_DEMO_DATA=True and NOTIFICATION_PROVIDER=console."""
        for notification in notifications:
            logger.info(f"[DEV CONSOLE EMAIL] To: {notification.recipient} | Subject: {notification.subject}")
            repo.update_status(notification.id, status="SENT", sent_at=datetime.utcnow())

    def _fail_unconfigured_batch(self, repo: NotificationRepository, notifications: list):
        """Fails notifications when SMTP provider is unconfigured in production."""
        for notification in notifications:
            logger.warning(f"Notification {notification.id} failed: SMTP provider is not configured.")
            repo.update_status(notification.id, status="FAILED", error_message="SMTP provider is not configured.")

    def _handle_send_error(self, repo: NotificationRepository, notification, error_msg: str):
        logger.error(f"Failed to send notification {notification.id}: {error_msg}")
        if notification.retry_count >= self.max_retries:
            repo.update_status(notification.id, status="FAILED", error_message=error_msg)
        else:
            # Leave as PENDING, increment retry count
            repo.update_status(notification.id, status="PENDING", error_message=error_msg, increment_retry=True)
