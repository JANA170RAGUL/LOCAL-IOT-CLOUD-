import logging
from typing import Dict, Any, Optional
from sqlalchemy.orm import Session
from app.modules.notifications.repositories.notification_repository import NotificationRepository
from app.modules.notifications.schemas.notification import NotificationCreate

logger = logging.getLogger(__name__)

class NotificationService:
    def __init__(self, db: Session):
        self.db = db
        self.repo = NotificationRepository(db)

    def enqueue_notification(
        self,
        template_name: str,
        recipient: str,
        context: Dict[str, Any],
        user_id: Optional[str] = None,
        channel: str = "EMAIL"
    ) -> Optional[str]:
        """
        Creates a notification from a template and context, and saves it in PENDING state.
        Returns the notification ID if successfully enqueued.
        """
        # Check user preferences if user_id is provided
        if user_id:
            pref = self.repo.get_user_preference_by_channel(user_id, channel)
            if pref and not pref.is_enabled:
                logger.info(f"User {user_id} has disabled {channel} notifications. Skipping.")
                return None

        # Fetch template
        template = self.repo.get_template_by_name(template_name)
        if not template:
            logger.error(f"Notification template '{template_name}' not found or inactive.")
            return None

        # Render template
        subject = self._render_template(template.subject_template, context)
        body = self._render_template(template.body_template, context)

        # Create notification record
        notification_in = NotificationCreate(
            user_id=user_id,
            recipient=recipient,
            channel=channel,
            subject=subject,
            body=body
        )
        notification = self.repo.create(notification_in)
        logger.info(f"Enqueued {channel} notification to {recipient} (ID: {notification.id})")
        return notification.id

    def _render_template(self, template_str: str, context: Dict[str, Any]) -> str:
        """
        Simple string replacement for templates.
        Replaces {{key}} with value from context.
        """
        rendered = template_str
        for key, value in context.items():
            placeholder = f"{{{{{key}}}}}"
            rendered = rendered.replace(placeholder, str(value))
        return rendered

    def ensure_default_templates(self):
        """
        Seed default notification templates if they don't exist.
        """
        templates = [
            {
                "name": "ALERT_TRIGGERED",
                "subject_template": "Alert: {{alert_title}}",
                "body_template": "An alert has been triggered on your device.\n\nRule: {{rule_name}}\nSeverity: {{severity}}\nValue: {{value}}\nTime: {{timestamp}}\n\nPlease check the dashboard for more details."
            },
            {
                "name": "USER_CREATED_PASSWORD",
                "subject_template": "Welcome to LocalIoTCloud - Account Created",
                "body_template": "Hello {{first_name}},\n\nYour account has been successfully created. Your temporary password is: {{password}}\n\nPlease log in and change your password."
            },
            {
                "name": "USER_PASSWORD_RESET",
                "subject_template": "LocalIoTCloud - Password Reset",
                "body_template": "Hello {{first_name}},\n\nYour password has been reset. Your temporary password is: {{password}}\n\nPlease log in and change your password."
            }
        ]
        
        for t in templates:
            if not self.repo.get_template_by_name(t["name"]):
                self.repo.create_template(
                    name=t["name"],
                    subject_template=t["subject_template"],
                    body_template=t["body_template"]
                )
                logger.info(f"Created default notification template: {t['name']}")
