from pydantic import BaseModel, ConfigDict
from datetime import datetime
from typing import Optional, List

# -----------------
# User Notification Preference
# -----------------

class UserNotificationPreferenceBase(BaseModel):
    channel: str
    is_enabled: bool

class UserNotificationPreferenceCreate(UserNotificationPreferenceBase):
    pass

class UserNotificationPreferenceUpdate(UserNotificationPreferenceBase):
    pass

class UserNotificationPreferenceResponse(UserNotificationPreferenceBase):
    id: str
    user_id: str
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

class UserNotificationPreferenceList(BaseModel):
    items: List[UserNotificationPreferenceResponse]

# -----------------
# Notification
# -----------------

class NotificationBase(BaseModel):
    user_id: Optional[str] = None
    recipient: str
    channel: str
    subject: str
    body: str

class NotificationCreate(NotificationBase):
    pass

class NotificationResponse(NotificationBase):
    id: str
    status: str
    retry_count: int
    error_message: Optional[str] = None
    sent_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

class NotificationListResponse(BaseModel):
    total: int
    items: List[NotificationResponse]

# -----------------
# Notification Template
# -----------------

class NotificationTemplateBase(BaseModel):
    name: str
    channel: str
    subject_template: str
    body_template: str
    is_active: bool = True

class NotificationTemplateResponse(NotificationTemplateBase):
    id: str
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
