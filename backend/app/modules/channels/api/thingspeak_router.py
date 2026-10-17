from typing import Optional, Dict, Any, List
from fastapi import APIRouter, Depends, HTTPException, Request, BackgroundTasks
from sqlalchemy.orm import Session
from datetime import datetime

from app.database.session import get_db
from app.modules.channels.models.channel import Channel, ChannelApiKey, ApiKeyType
from app.modules.channels.repositories.channel_repository import ChannelRepository
from app.modules.channels.services.channel_data_service import ChannelDataService
from app.modules.channels.services.webhook_dispatcher import webhook_dispatcher
from app.modules.channels.api.channel_data_router import validate_channel_and_key, validate_channel_read

router = APIRouter(prefix="/thingspeak", tags=["ThingSpeak Compatibility"])

def get_channel_repo(db: Session = Depends(get_db)) -> ChannelRepository:
    return ChannelRepository(db)

def _format_thingspeak_channel(channel: Channel) -> Dict[str, Any]:
    """Format channel metadata into ThingSpeak format."""
    ch_dict = {
        "id": channel.id,
        "name": channel.name,
        "description": channel.description,
        "created_at": channel.created_at.isoformat() if hasattr(channel, 'created_at') else datetime.utcnow().isoformat(),
        "updated_at": channel.updated_at.isoformat() if hasattr(channel, 'updated_at') else datetime.utcnow().isoformat(),
    }
    for field in channel.fields:
        ch_dict[field.field_key] = field.name
    return ch_dict

def _format_thingspeak_feed(feed: Dict[str, Any], entry_id: int = 1) -> Dict[str, Any]:
    """Ensure feed looks like ThingSpeak with an entry_id and all values as strings (optional but typical for TS)."""
    formatted = {"entry_id": entry_id}
    for k, v in feed.items():
        formatted[k] = str(v) if v is not None else None
    return formatted

@router.post("/update")
@router.get("/update")
async def thingspeak_update(
    request: Request,
    background_tasks: BackgroundTasks,
    repo: ChannelRepository = Depends(get_channel_repo)
):
    """
    ThingSpeak compatible write endpoint.
    Expects api_key and fields (field1, field2, etc.).
    """
    # Extract data from form, json, or query params
    data: Dict[str, Any] = {}
    content_type = request.headers.get("content-type", "")

    if "application/json" in content_type:
        try:
            data = await request.json()
        except Exception:
            pass
    elif "application/x-www-form-urlencoded" in content_type or "multipart/form-data" in content_type:
        try:
            form_data = await request.form()
            data = dict(form_data)
        except Exception:
            pass
    
    # Merge query params (ThingSpeak often uses GET for updates, or POST with query params)
    try:
        data.update(dict(request.query_params))
    except Exception:
        pass

    api_key = data.pop("api_key", None)
    
    if not api_key:
        # ThingSpeak returns 0 for failure (or HTTP errors)
        return 0

    try:
        channel = validate_channel_and_key(None, api_key, ApiKeyType.WRITE, repo)
    except Exception:
        return 0

    # Filter data to only include known fields
    write_data = {}
    for k, v in data.items():
        if any(f.field_key == k for f in channel.fields) or k in ["created_at"]:
            write_data[k] = v

    if not write_data:
        return 0

    try:
        ChannelDataService.write_data(channel, write_data)
        webhook_dispatcher.trigger_event(repo.db, channel.id, "telemetry.received", write_data, background_tasks)
        
        # ThingSpeak usually returns an entry ID on success. Return 1 to signify success.
        return 1 
    except Exception:
        return 0

@router.get("/channels/{channel_id}/feeds.json")
def get_channel_feeds_ts(
    channel_id: str,
    api_key: Optional[str] = None,
    results: int = 100,
    repo: ChannelRepository = Depends(get_channel_repo)
):
    """ThingSpeak compatible read all feeds."""
    try:
        channel = validate_channel_read(channel_id, api_key, None, repo)
    except HTTPException as e:
        return {"error": e.detail}

    feeds = ChannelDataService.get_feeds(channel.id, results=results)
    
    # Format feeds
    formatted_feeds = []
    for i, feed in enumerate(reversed(feeds)): # Reversing to give older feeds lower entry_ids
        formatted_feeds.append(_format_thingspeak_feed(feed, entry_id=i+1))
    formatted_feeds.reverse() # Back to newest first

    return {
        "channel": _format_thingspeak_channel(channel),
        "feeds": formatted_feeds
    }

@router.get("/channels/{channel_id}/feeds/last.json")
def get_channel_last_feed_ts(
    channel_id: str,
    api_key: Optional[str] = None,
    repo: ChannelRepository = Depends(get_channel_repo)
):
    """ThingSpeak compatible read last feed."""
    try:
        channel = validate_channel_read(channel_id, api_key, None, repo)
    except HTTPException as e:
        return {"error": e.detail}

    feed = ChannelDataService.get_last_feed(channel.id)
    if not feed:
        return {"channel": _format_thingspeak_channel(channel), "feeds": []}

    return {
        "channel": _format_thingspeak_channel(channel),
        "feeds": [_format_thingspeak_feed(feed, entry_id=1)]
    }

@router.get("/channels/{channel_id}/fields/{field_id}.json")
def get_channel_field_feeds_ts(
    channel_id: str,
    field_id: str, # typically 1, 2, 3... we map this to field1, field2...
    api_key: Optional[str] = None,
    results: int = 100,
    repo: ChannelRepository = Depends(get_channel_repo)
):
    """ThingSpeak compatible read specific field feeds."""
    try:
        channel = validate_channel_read(channel_id, api_key, None, repo)
    except HTTPException as e:
        return {"error": e.detail}
        
    field_key = f"field{field_id}" if field_id.isdigit() else field_id

    # Check if field exists
    if not any(f.field_key == field_key for f in channel.fields):
        return {"error": "Field not found"}

    feeds = ChannelDataService.get_field_feed(channel.id, field_key, results=results)
    
    formatted_feeds = []
    for i, feed in enumerate(reversed(feeds)):
        formatted_feeds.append(_format_thingspeak_feed(feed, entry_id=i+1))
    formatted_feeds.reverse()

    return {
        "channel": _format_thingspeak_channel(channel),
        "feeds": formatted_feeds
    }

@router.get("/channels/{channel_id}/fields/{field_id}/last.json")
def get_channel_field_last_feed_ts(
    channel_id: str,
    field_id: str,
    api_key: Optional[str] = None,
    repo: ChannelRepository = Depends(get_channel_repo)
):
    """ThingSpeak compatible read last specific field feed."""
    try:
        channel = validate_channel_read(channel_id, api_key, None, repo)
    except HTTPException as e:
        return {"error": e.detail}

    field_key = f"field{field_id}" if field_id.isdigit() else field_id

    if not any(f.field_key == field_key for f in channel.fields):
        return {"error": "Field not found"}

    feeds = ChannelDataService.get_field_feed(channel.id, field_key, results=1)
    
    if not feeds:
        return {"channel": _format_thingspeak_channel(channel), "feeds": []}

    return {
        "channel": _format_thingspeak_channel(channel),
        "feeds": [_format_thingspeak_feed(feeds[0], entry_id=1)]
    }
