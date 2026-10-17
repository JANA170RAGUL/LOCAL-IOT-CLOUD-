from typing import Optional, Dict, Any, Union, List
from fastapi import APIRouter, Depends, HTTPException, Request, Response, Form, UploadFile, File, Query, BackgroundTasks
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.core.auth import get_current_user_optional
from app.modules.users.models.user import User
from app.modules.channels.models.channel import Channel, ChannelApiKey, ApiKeyType
from app.modules.channels.repositories.channel_repository import ChannelRepository
from app.modules.channels.services.channel_data_service import ChannelDataService
from app.modules.channels.services.webhook_dispatcher import webhook_dispatcher

from app.config.settings import settings
from app.modules.channels.security.authenticator import ChannelKeyAuthenticator
from app.modules.channels.services.upload_limiter import read_limited_upload

router = APIRouter(prefix="/channels", tags=["channels data"])

def get_channel_repo(db: Session = Depends(get_db)) -> ChannelRepository:
    return ChannelRepository(db)

def _extract_api_key(request: Request, payload_dict: Optional[Dict[str, Any]] = None) -> Optional[str]:
    header_key = request.headers.get("X-Channel-Key")
    if header_key:
        return header_key.strip()
    
    auth_header = request.headers.get("Authorization")
    if auth_header and auth_header.startswith("Bearer "):
        token = auth_header[7:].strip()
        if token.startswith("liot_ch_"):
            return token

    if payload_dict and "api_key" in payload_dict:
        return str(payload_dict.pop("api_key")).strip()

    query_key = request.query_params.get("api_key")
    if query_key:
        return query_key.strip()

    return None

def validate_channel_and_key(channel_id: Optional[str], api_key: str, key_type: ApiKeyType, repo: ChannelRepository) -> Channel:
    required_str = key_type.value if hasattr(key_type, "value") else str(key_type).upper()
    credential = ChannelKeyAuthenticator.authenticate(repo.db, api_key, required_type=required_str)

    channel = repo.get_by_id(credential.channel_id)
    if not channel:
        raise HTTPException(status_code=404, detail="Channel not found")

    if channel_id and channel.id != channel_id:
        raise HTTPException(status_code=403, detail="API key does not belong to the requested channel")

    return channel

def validate_channel_read(
    channel_id: str, 
    api_key: Optional[str], 
    current_user: Optional[User],
    repo: ChannelRepository
) -> Channel:
    channel = repo.get_by_id(channel_id)
    if not channel:
        raise HTTPException(status_code=404, detail="Channel not found")

    from app.modules.channels.models.channel import ChannelVisibility

    if channel.visibility == ChannelVisibility.PUBLIC:
        return channel

    elif channel.visibility == ChannelVisibility.ENTERPRISE:
        if not current_user:
            raise HTTPException(status_code=401, detail="Authentication required for Enterprise channels")
        if channel.owner_id != current_user.id:
            raise HTTPException(status_code=403, detail="Not authorized to access this Enterprise channel")
        return channel

    else: # PRIVATE
        if current_user and channel.owner_id == current_user.id:
            return channel

        if not api_key:
            raise HTTPException(status_code=401, detail="Read API Key required for private channel")

        credential = ChannelKeyAuthenticator.authenticate(repo.db, api_key, required_type="READ")
        if credential.channel_id != channel.id:
            raise HTTPException(status_code=403, detail="API key does not belong to this channel")

        return channel

# --- WRITE ENDPOINTS ---

@router.post("/write")
@router.post("/{channel_id}/write")
async def write_channel_data(
    request: Request,
    background_tasks: BackgroundTasks,
    channel_id: Optional[str] = None,
    repo: ChannelRepository = Depends(get_channel_repo)
):
    content_type = request.headers.get("content-type", "")
    data: Dict[str, Any] = {}

    if "application/json" in content_type:
        try:
            data = await request.json()
        except Exception:
            raise HTTPException(status_code=400, detail="Invalid JSON payload")
    elif "application/x-www-form-urlencoded" in content_type:
        form_data = await request.form()
        data = dict(form_data)
    else:
        data = dict(request.query_params)
        if not data:
            raise HTTPException(status_code=400, detail="Unsupported content type and no query params provided")

    api_key = _extract_api_key(request, data)
    if not api_key:
        raise HTTPException(status_code=401, detail="Missing Channel API key")

    channel = validate_channel_and_key(channel_id, api_key, ApiKeyType.WRITE, repo)

    try:
        ChannelDataService.write_data(channel, data)
        webhook_dispatcher.trigger_event(repo.db, channel.id, "telemetry.received", data, background_tasks)
        return {"status": "success", "channel_id": channel.id}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except RuntimeError as e:
        raise HTTPException(status_code=500, detail="Internal server error writing to database")

@router.post("/write/bulk")
@router.post("/{channel_id}/write/bulk")
async def write_channel_data_bulk(
    request: Request,
    background_tasks: BackgroundTasks,
    channel_id: Optional[str] = None,
    repo: ChannelRepository = Depends(get_channel_repo)
):
    content_type = request.headers.get("content-type", "")
    if "application/json" not in content_type:
        raise HTTPException(status_code=415, detail="Bulk writes only support application/json")

    try:
        data_list: List[Dict[str, Any]] = await request.json()
        if not isinstance(data_list, list):
            raise ValueError()
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid JSON payload. Expected a JSON array.")

    if not data_list:
        raise HTTPException(status_code=400, detail="Empty bulk array")

    max_points = getattr(settings, "channel_bulk_max_points", 1000)
    if len(data_list) > max_points:
        raise HTTPException(status_code=413, detail=f"Bulk upload exceeds max entries limit of {max_points}.")

    api_key = _extract_api_key(request, data_list[0] if data_list else None)
    if not api_key:
        raise HTTPException(status_code=401, detail="Missing api_key")

    channel = validate_channel_and_key(channel_id, api_key, ApiKeyType.WRITE, repo)

    try:
        ChannelDataService.write_data_bulk(channel, data_list)
        webhook_dispatcher.trigger_event(repo.db, channel.id, "telemetry.bulk_received", {"count": len(data_list)}, background_tasks)
        return {"status": "success", "channel_id": channel.id, "records_written": len(data_list)}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except RuntimeError as e:
        raise HTTPException(status_code=500, detail="Internal server error writing to database")

@router.post("/{channel_id}/import/{format}")
async def import_channel_data_endpoint(
    channel_id: str,
    format: str,
    file: UploadFile = File(...),
    api_key: Optional[str] = Form(None),
    current_user: Optional[User] = Depends(get_current_user_optional),
    repo: ChannelRepository = Depends(get_channel_repo)
):
    norm_format = format.lower()
    if norm_format in ["excel", "xlsx"]:
        norm_format = "excel"
    elif norm_format not in ["csv", "json"]:
        raise HTTPException(status_code=400, detail="Unsupported format. Use csv, excel, or json.")

    channel = None
    if current_user:
        ch = repo.get_by_id(channel_id)
        if ch and ch.owner_id == current_user.id:
            channel = ch

    if not channel:
        if not api_key:
            raise HTTPException(status_code=401, detail="Missing api_key or authentication")
        channel = validate_channel_and_key(channel_id, api_key, ApiKeyType.WRITE, repo)

    try:
        max_bytes = getattr(settings, "channel_import_max_bytes", 5 * 1024 * 1024)
        content = await read_limited_upload(file, max_bytes=max_bytes)
        summary = ChannelDataService.import_channel_data(channel, content, norm_format)
        return summary
    except HTTPException:
        raise
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail="Internal server error importing data")

# --- READ ENDPOINTS ---

@router.get("/{channel_id}/export/{format}")
def export_channel_data_endpoint(
    channel_id: str,
    format: str,
    api_key: Optional[str] = Query(None),
    start: Optional[str] = Query(None),
    end: Optional[str] = Query(None),
    fields: Optional[List[str]] = Query(None),
    current_user: Optional[User] = Depends(get_current_user_optional),
    repo: ChannelRepository = Depends(get_channel_repo)
):
    if format not in ["csv", "excel", "json"]:
        raise HTTPException(status_code=400, detail="Unsupported format. Use csv, excel, or json.")
        
    channel = validate_channel_read(channel_id, api_key, current_user, repo)
    
    try:
        content = ChannelDataService.export_channel_data(channel, format, start, end, fields)
        
        media_types = {
            "csv": "text/csv",
            "excel": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            "json": "application/json"
        }
        
        exts = {
            "csv": "csv",
            "excel": "xlsx",
            "json": "json"
        }
        
        filename = f"channel_{channel.id}_export.{exts[format]}"
        
        return Response(
            content=content,
            media_type=media_types[format],
            headers={"Content-Disposition": f"attachment; filename={filename}"}
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail="Internal server error exporting data")

@router.get("/{channel_id}/dashboard")
def get_channel_dashboard(
    channel_id: str,
    api_key: Optional[str] = None,
    current_user: Optional[User] = Depends(get_current_user_optional),
    repo: ChannelRepository = Depends(get_channel_repo)
):
    channel = validate_channel_read(channel_id, api_key, current_user, repo)
    metrics = ChannelDataService.get_channel_metrics(channel)
    
    # Mocking the API Usage for now since we don't have an API Gateway log DB
    metrics["api_usage"] = {
        "requests_today": metrics["messages_today"],
        "failed_requests": 0,
        "invalid_keys": 0,
        "average_response_time_ms": 45
    }
    
    # Mocking Data Quality
    metrics["data_quality"] = {
        "missing_values": 0,
        "duplicate_writes": 0,
        "packet_loss_estimate": "0%"
    }
    
    return metrics

@router.get("/{channel_id}/feeds")
def get_channel_feeds(
    channel_id: str,
    api_key: Optional[str] = None,
    results: int = 100,
    current_user: Optional[User] = Depends(get_current_user_optional),
    repo: ChannelRepository = Depends(get_channel_repo)
):
    channel = validate_channel_read(channel_id, api_key, current_user, repo)
    feeds = ChannelDataService.get_feeds(channel.id, results=results)
    return {"channel": channel.name, "feeds": feeds}

@router.get("/{channel_id}/feeds/last")
def get_last_channel_feed(
    channel_id: str,
    api_key: Optional[str] = None,
    current_user: Optional[User] = Depends(get_current_user_optional),
    repo: ChannelRepository = Depends(get_channel_repo)
):
    channel = validate_channel_read(channel_id, api_key, current_user, repo)
    feed = ChannelDataService.get_last_feed(channel.id)
    return feed if feed else {}

@router.get("/{channel_id}/fields/{field_key}")
def get_channel_field_feeds(
    channel_id: str,
    field_key: str,
    api_key: Optional[str] = None,
    results: int = 100,
    current_user: Optional[User] = Depends(get_current_user_optional),
    repo: ChannelRepository = Depends(get_channel_repo)
):
    channel = validate_channel_read(channel_id, api_key, current_user, repo)
    
    # Check if field exists
    if not any(f.field_key == field_key for f in channel.fields):
        raise HTTPException(status_code=404, detail="Field not found")

    feeds = ChannelDataService.get_field_feed(channel.id, field_key, results=results)
    return {"channel": channel.name, "field": field_key, "feeds": feeds}

@router.get("/{channel_id}/fields/{field_key}/last")
def get_last_channel_field_feed(
    channel_id: str,
    field_key: str,
    api_key: Optional[str] = None,
    current_user: Optional[User] = Depends(get_current_user_optional),
    repo: ChannelRepository = Depends(get_channel_repo)
):
    channel = validate_channel_read(channel_id, api_key, current_user, repo)
    
    if not any(f.field_key == field_key for f in channel.fields):
        raise HTTPException(status_code=404, detail="Field not found")

    feeds = ChannelDataService.get_field_feed(channel.id, field_key, results=1)
    return feeds[0] if feeds else {}

# --- DEDICATED PUBLIC ENDPOINTS (Aliasing the above for simpler URLs) ---

@router.get("/public/{channel_id}")
def get_public_channel_details(
    channel_id: str,
    repo: ChannelRepository = Depends(get_channel_repo)
):
    channel = validate_channel_read(channel_id, None, None, repo)
    return {
        "id": channel.id,
        "name": channel.name,
        "description": channel.description,
        "fields": [{"field_key": f.field_key, "name": f.name, "unit": f.unit, "data_type": f.data_type} for f in channel.fields]
    }

@router.get("/public/{channel_id}/feeds")
def get_public_channel_feeds(
    channel_id: str,
    results: int = 100,
    repo: ChannelRepository = Depends(get_channel_repo)
):
    channel = validate_channel_read(channel_id, None, None, repo)
    feeds = ChannelDataService.get_feeds(channel.id, results=results)
    return {"channel": channel.name, "feeds": feeds}

@router.get("/public/{channel_id}/feeds/last")
def get_public_channel_feed_last(
    channel_id: str,
    repo: ChannelRepository = Depends(get_channel_repo)
):
    channel = validate_channel_read(channel_id, None, None, repo)
    feed = ChannelDataService.get_last_feed(channel.id)
    return feed if feed else {}
