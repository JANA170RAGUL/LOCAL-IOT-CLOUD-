from sqlalchemy.orm import Session
from sqlalchemy import desc
from typing import List, Tuple, Optional
from app.modules.notifications.models.notification import Notification, UserNotificationPreference, NotificationTemplate
from app.modules.notifications.schemas.notification import NotificationCreate

class NotificationRepository:
    def __init__(self, db: Session):
        self.db = db

    # -----------------
    # Notification
    # -----------------
    def create(self, notification_in: NotificationCreate) -> Notification:
        db_obj = Notification(**notification_in.model_dump())
        self.db.add(db_obj)
        self.db.commit()
        self.db.refresh(db_obj)
        return db_obj

    def get_pending(self, limit: int = 50) -> List[Notification]:
        return self.db.query(Notification).filter(Notification.status == "PENDING").order_by(Notification.created_at).limit(limit).all()

    def update_status(self, notification_id: str, status: str, error_message: str = None, sent_at=None, increment_retry: bool = False):
        notification = self.db.query(Notification).filter(Notification.id == notification_id).first()
        if notification:
            notification.status = status
            if error_message is not None:
                notification.error_message = error_message
            if sent_at is not None:
                notification.sent_at = sent_at
            if increment_retry:
                notification.retry_count += 1
            self.db.commit()
            self.db.refresh(notification)
        return notification

    def list_by_user(self, user_id: str, skip: int = 0, limit: int = 100) -> Tuple[List[Notification], int]:
        query = self.db.query(Notification).filter(Notification.user_id == user_id)
        total = query.count()
        items = query.order_by(desc(Notification.created_at)).offset(skip).limit(limit).all()
        return items, total

    # -----------------
    # Preferences
    # -----------------
    def get_user_preferences(self, user_id: str) -> List[UserNotificationPreference]:
        return self.db.query(UserNotificationPreference).filter(UserNotificationPreference.user_id == user_id).all()

    def get_user_preference_by_channel(self, user_id: str, channel: str) -> Optional[UserNotificationPreference]:
        return self.db.query(UserNotificationPreference).filter(
            UserNotificationPreference.user_id == user_id,
            UserNotificationPreference.channel == channel
        ).first()

    def set_user_preference(self, user_id: str, channel: str, is_enabled: bool) -> UserNotificationPreference:
        pref = self.get_user_preference_by_channel(user_id, channel)
        if pref:
            pref.is_enabled = is_enabled
        else:
            pref = UserNotificationPreference(user_id=user_id, channel=channel, is_enabled=is_enabled)
            self.db.add(pref)
        self.db.commit()
        self.db.refresh(pref)
        return pref

    # -----------------
    # Templates
    # -----------------
    def get_template_by_name(self, name: str) -> Optional[NotificationTemplate]:
        return self.db.query(NotificationTemplate).filter(
            NotificationTemplate.name == name,
            NotificationTemplate.is_active == True
        ).first()

    def create_template(self, name: str, subject_template: str, body_template: str, channel: str = "EMAIL") -> NotificationTemplate:
        template = NotificationTemplate(
            name=name,
            channel=channel,
            subject_template=subject_template,
            body_template=body_template
        )
        self.db.add(template)
        self.db.commit()
        self.db.refresh(template)
        return template
