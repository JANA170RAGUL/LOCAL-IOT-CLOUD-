from fastapi import APIRouter, Depends, HTTPException
from typing import List

from app.core.auth import get_current_user
from app.modules.users.models.user import User
from app.modules.notifications.schemas.notification import (
    NotificationListResponse,
    UserNotificationPreferenceResponse,
    UserNotificationPreferenceUpdate
)
from app.modules.notifications.repositories.notification_repository import NotificationRepository
from app.modules.notifications.dependencies import get_notification_repository

router = APIRouter(prefix="/notifications", tags=["Notifications"])

@router.get("/history", response_model=NotificationListResponse)
def get_notification_history(
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(get_current_user),
    repo: NotificationRepository = Depends(get_notification_repository)
):
    """Get the current user's notification history."""
    items, total = repo.list_by_user(user_id=current_user.id, skip=skip, limit=limit)
    return {"total": total, "items": items}

@router.get("/preferences", response_model=List[UserNotificationPreferenceResponse])
def get_notification_preferences(
    current_user: User = Depends(get_current_user),
    repo: NotificationRepository = Depends(get_notification_repository)
):
    """Get the current user's notification preferences."""
    prefs = repo.get_user_preferences(user_id=current_user.id)
    # Ensure EMAIL pref exists
    if not any(p.channel == "EMAIL" for p in prefs):
        repo.set_user_preference(current_user.id, "EMAIL", True)
        prefs = repo.get_user_preferences(user_id=current_user.id)
    return prefs

@router.put("/preferences", response_model=UserNotificationPreferenceResponse)
def update_notification_preference(
    pref_in: UserNotificationPreferenceUpdate,
    current_user: User = Depends(get_current_user),
    repo: NotificationRepository = Depends(get_notification_repository)
):
    """Update a specific channel preference."""
    pref = repo.set_user_preference(
        user_id=current_user.id,
        channel=pref_in.channel,
        is_enabled=pref_in.is_enabled
    )
    return pref
