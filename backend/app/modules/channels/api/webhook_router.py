from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from pydantic import BaseModel, Field
import uuid

from app.database.session import get_db
from app.core.auth import get_current_user
from app.modules.users.models.user import User
from app.modules.channels.models.channel import Channel, ChannelWebhook, WebhookDeliveryLog, WebhookType
from app.modules.channels.services.webhook_dispatcher import webhook_dispatcher
from app.modules.channels.security.webhook_crypto import encrypt_secret
from app.modules.channels.security.webhook_url_validator import validate_webhook_url

router = APIRouter(prefix="/channels/{channel_id}/webhooks", tags=["webhooks"])

def get_channel_owner(channel_id: str, db: Session, user: User) -> Channel:
    channel = db.query(Channel).filter(Channel.id == channel_id).first()
    if not channel:
        raise HTTPException(status_code=404, detail="Channel not found")
    if channel.owner_id != user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
    return channel

# --- Pydantic Schemas ---
class WebhookCreateUpdate(BaseModel):
    name: str
    target_url: str
    webhook_type: WebhookType
    secret_token: Optional[str] = None
    auth_header: Optional[str] = None
    is_active: bool = True
    max_retries: int = Field(default=3, ge=0, le=10)
    timeout_seconds: int = Field(default=5, ge=1, le=10)
    trigger_events: List[str]

class WebhookResponse(BaseModel):
    id: str
    channel_id: str
    name: str
    target_url: str
    webhook_type: WebhookType
    auth_header: Optional[str] = None
    is_active: bool
    max_retries: int
    timeout_seconds: int
    trigger_events: List[str]
    has_secret: bool

    class Config:
        from_attributes = True

class WebhookLogResponse(BaseModel):
    id: str
    event_type: str
    http_status: Optional[int]
    response_time_ms: Optional[int]
    success: bool
    response_body: Optional[str]
    retry_count: int
    created_at: str

    class Config:
        from_attributes = True

def _to_webhook_response(webhook: ChannelWebhook) -> WebhookResponse:
    return WebhookResponse(
        id=webhook.id,
        channel_id=webhook.channel_id,
        name=webhook.name,
        target_url=webhook.target_url,
        webhook_type=webhook.webhook_type,
        auth_header=webhook.auth_header,
        is_active=webhook.is_active,
        max_retries=webhook.max_retries,
        timeout_seconds=webhook.timeout_seconds,
        trigger_events=webhook.trigger_events or [],
        has_secret=bool(webhook.secret_encrypted),
    )

# --- Endpoints ---

@router.get("", response_model=List[WebhookResponse])
def get_webhooks(
    channel_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    channel = get_channel_owner(channel_id, db, current_user)
    webhooks = db.query(ChannelWebhook).filter(ChannelWebhook.channel_id == channel.id).all()
    return [_to_webhook_response(wh) for wh in webhooks]

@router.post("", response_model=WebhookResponse)
def create_webhook(
    channel_id: str,
    payload: WebhookCreateUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    channel = get_channel_owner(channel_id, db, current_user)

    validate_webhook_url(payload.target_url)

    secret_enc = encrypt_secret(payload.secret_token) if payload.secret_token else None

    webhook = ChannelWebhook(
        channel_id=channel.id,
        name=payload.name,
        target_url=payload.target_url,
        webhook_type=payload.webhook_type,
        secret_encrypted=secret_enc,
        auth_header=payload.auth_header,
        is_active=payload.is_active,
        max_retries=payload.max_retries,
        timeout_seconds=payload.timeout_seconds,
        trigger_events=payload.trigger_events
    )
    db.add(webhook)
    db.commit()
    db.refresh(webhook)
    return _to_webhook_response(webhook)

@router.put("/{webhook_id}", response_model=WebhookResponse)
def update_webhook(
    channel_id: str,
    webhook_id: str,
    payload: WebhookCreateUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    channel = get_channel_owner(channel_id, db, current_user)
    
    webhook = db.query(ChannelWebhook).filter(
        ChannelWebhook.id == webhook_id, 
        ChannelWebhook.channel_id == channel.id
    ).first()
    
    if not webhook:
        raise HTTPException(status_code=404, detail="Webhook not found")

    validate_webhook_url(payload.target_url)
        
    webhook.name = payload.name
    webhook.target_url = payload.target_url
    webhook.webhook_type = payload.webhook_type
    webhook.auth_header = payload.auth_header
    webhook.is_active = payload.is_active
    webhook.max_retries = payload.max_retries
    webhook.timeout_seconds = payload.timeout_seconds
    webhook.trigger_events = payload.trigger_events

    if payload.secret_token is not None:
        if payload.secret_token == "":
            webhook.secret_encrypted = None
        else:
            webhook.secret_encrypted = encrypt_secret(payload.secret_token)

    db.commit()
    db.refresh(webhook)
    return _to_webhook_response(webhook)

@router.delete("/{webhook_id}")
def delete_webhook(
    channel_id: str,
    webhook_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    channel = get_channel_owner(channel_id, db, current_user)
    webhook = db.query(ChannelWebhook).filter(
        ChannelWebhook.id == webhook_id, 
        ChannelWebhook.channel_id == channel.id
    ).first()
    
    if not webhook:
        raise HTTPException(status_code=404, detail="Webhook not found")
        
    db.delete(webhook)
    db.commit()
    return {"status": "success"}

@router.post("/{webhook_id}/test")
def test_webhook(
    channel_id: str,
    webhook_id: str,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    channel = get_channel_owner(channel_id, db, current_user)
    webhook = db.query(ChannelWebhook).filter(
        ChannelWebhook.id == webhook_id, 
        ChannelWebhook.channel_id == channel.id
    ).first()
    
    if not webhook:
        raise HTTPException(status_code=404, detail="Webhook not found")
        
    test_payload = {
        "message": "This is a test event from LocalIoTCloud",
        "test_field1": 42.0,
        "test_field2": "Hello World"
    }
    
    background_tasks.add_task(
        webhook_dispatcher.dispatch_task,
        webhook_id=webhook.id,
        event="test.event",
        channel_id=channel.id,
        raw_payload=test_payload
    )
    
    return {"status": "success", "detail": "Test webhook triggered in background"}

@router.get("/{webhook_id}/logs", response_model=List[WebhookLogResponse])
def get_webhook_logs(
    channel_id: str,
    webhook_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    channel = get_channel_owner(channel_id, db, current_user)
    webhook = db.query(ChannelWebhook).filter(
        ChannelWebhook.id == webhook_id, 
        ChannelWebhook.channel_id == channel.id
    ).first()
    
    if not webhook:
        raise HTTPException(status_code=404, detail="Webhook not found")
        
    logs = db.query(WebhookDeliveryLog).filter(
        WebhookDeliveryLog.webhook_id == webhook.id
    ).order_by(WebhookDeliveryLog.created_at.desc()).limit(50).all()
    
    return [{
        "id": log.id,
        "event_type": log.event_type,
        "http_status": log.http_status,
        "response_time_ms": log.response_time_ms,
        "success": log.success,
        "response_body": log.response_body,
        "retry_count": log.retry_count,
        "created_at": log.created_at.isoformat()
    } for log in logs]
