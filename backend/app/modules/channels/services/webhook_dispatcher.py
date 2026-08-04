import logging
import requests
import json
import time
from typing import Dict, Any, List
from sqlalchemy.orm import Session
from app.database.session import SessionLocal
from app.modules.channels.models.channel import ChannelWebhook, WebhookDeliveryLog, WebhookType

logger = logging.getLogger(__name__)

class WebhookDispatcher:
    
    @staticmethod
    def format_payload(webhook: ChannelWebhook, event: str, channel_id: str, payload: Dict[str, Any]) -> Dict[str, Any]:
        """Format the payload based on the webhook type."""
        base_payload = {
            "event": event,
            "channel_id": channel_id,
            "timestamp": payload.get("created_at") or time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
            "data": payload
        }
        
        if webhook.webhook_type == WebhookType.SLACK:
            return {
                "blocks": [
                    {
                        "type": "section",
                        "text": {
                            "type": "mrkdwn",
                            "text": f"*Event:* {event}\n*Channel:* {channel_id}\n```\n{json.dumps(payload, indent=2)}\n```"
                        }
                    }
                ]
            }
        elif webhook.webhook_type == WebhookType.DISCORD:
            return {
                "content": f"**Event:** {event}\n**Channel:** {channel_id}",
                "embeds": [
                    {
                        "description": f"```json\n{json.dumps(payload, indent=2)}\n```",
                        "color": 3447003
                    }
                ]
            }
        elif webhook.webhook_type == WebhookType.TEAMS:
            return {
                "@type": "MessageCard",
                "@context": "http://schema.org/extensions",
                "themeColor": "0076D7",
                "summary": f"Event: {event}",
                "sections": [{
                    "activityTitle": f"New event: {event}",
                    "activitySubtitle": f"Channel ID: {channel_id}",
                    "text": f"<pre>{json.dumps(payload, indent=2)}</pre>"
                }]
            }
        else:
            # HTTP / EMAIL / Generic
            return base_payload

    @staticmethod
    def _send_request(webhook: ChannelWebhook, payload: Dict[str, Any]) -> tuple[bool, int, int, str]:
        """Executes the HTTP request and returns (success, status_code, duration_ms, response_body)."""
        headers = {
            "Content-Type": "application/json",
            "User-Agent": "LocalIoTCloud-WebhookEngine/1.0"
        }
        
        if webhook.auth_header and webhook.secret_token:
            headers[webhook.auth_header] = webhook.secret_token
            
        start_time = time.time()
        try:
            response = requests.post(
                webhook.target_url, 
                json=payload, 
                headers=headers, 
                timeout=webhook.timeout_seconds
            )
            duration = int((time.time() - start_time) * 1000)
            return (response.ok, response.status_code, duration, response.text[:2000])
        except requests.exceptions.RequestException as e:
            duration = int((time.time() - start_time) * 1000)
            return (False, 0, duration, str(e)[:2000])

    @staticmethod
    def dispatch_task(webhook_id: str, event: str, channel_id: str, raw_payload: Dict[str, Any]):
        """Background task function to process a single webhook delivery with retries."""
        db: Session = SessionLocal()
        try:
            webhook = db.query(ChannelWebhook).filter(ChannelWebhook.id == webhook_id).first()
            if not webhook or not webhook.is_active:
                return

            formatted_payload = WebhookDispatcher.format_payload(webhook, event, channel_id, raw_payload)
            
            success = False
            status_code = 0
            duration = 0
            response_body = ""
            
            for attempt in range(webhook.max_retries + 1):
                success, status_code, duration, response_body = WebhookDispatcher._send_request(webhook, formatted_payload)
                if success:
                    break
                
                # Exponential backoff: wait before next retry if not last attempt
                if attempt < webhook.max_retries:
                    time.sleep(2 ** attempt)

            # Log the delivery attempt
            log = WebhookDeliveryLog(
                webhook_id=webhook.id,
                event_type=event,
                http_status=status_code,
                response_time_ms=duration,
                success=success,
                response_body=response_body,
                retry_count=attempt
            )
            db.add(log)
            db.commit()

        except Exception as e:
            logger.error(f"Error dispatching webhook {webhook_id}: {e}", exc_info=True)
        finally:
            db.close()

    @staticmethod
    def trigger_event(db: Session, channel_id: str, event: str, payload: Dict[str, Any], background_tasks):
        """Finds subscribed webhooks and queues background tasks."""
        webhooks = db.query(ChannelWebhook).filter(
            ChannelWebhook.channel_id == channel_id,
            ChannelWebhook.is_active == True
        ).all()
        
        for wh in webhooks:
            # Check if event is in trigger_events
            if isinstance(wh.trigger_events, list) and event in wh.trigger_events:
                background_tasks.add_task(
                    WebhookDispatcher.dispatch_task,
                    webhook_id=wh.id,
                    event=event,
                    channel_id=channel_id,
                    raw_payload=payload
                )

webhook_dispatcher = WebhookDispatcher()
