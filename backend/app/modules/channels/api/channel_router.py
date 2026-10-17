from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.core.auth import get_current_user
from app.modules.users.models.user import User

from app.modules.channels.schemas.channel import (
    ChannelCreate,
    ChannelUpdate,
    ChannelResponse,
    ChannelApiKeyCreate,
    ChannelApiKeyCreatedResponse,
)
from app.modules.channels.repositories.channel_repository import ChannelRepository
from app.modules.channels.models.channel import ApiKeyType

from app.core.access_scope import AccessScope, get_access_scope
from app.core.tenant_guard import TenantGuard

router = APIRouter(prefix="/channels", tags=["channels"])


def get_channel_repo(db: Session = Depends(get_db)) -> ChannelRepository:
    return ChannelRepository(db)


@router.get("", response_model=List[ChannelResponse])
def get_channels(
    current_user: User = Depends(get_current_user),
    repo: ChannelRepository = Depends(get_channel_repo)
):
    """Get all channels owned by the user."""
    return repo.get_by_owner(current_user.id)


@router.post("", response_model=ChannelResponse, status_code=status.HTTP_201_CREATED)
def create_channel(
    payload: ChannelCreate,
    current_user: User = Depends(get_current_user),
    scope: AccessScope = Depends(get_access_scope),
    db: Session = Depends(get_db),
    repo: ChannelRepository = Depends(get_channel_repo)
):
    """Create a new channel."""
    if getattr(payload, "project_id", None):
        TenantGuard.project(db, payload.project_id, scope)
    return repo.create(owner_id=current_user.id, obj_in=payload)


@router.get("/{channel_id}", response_model=ChannelResponse)
def get_channel(
    channel_id: str,
    current_user: User = Depends(get_current_user),
    repo: ChannelRepository = Depends(get_channel_repo)
):
    """Get a specific channel."""
    channel = repo.get_by_id(channel_id)
    if not channel:
        raise HTTPException(status_code=404, detail="Channel not found")
    if channel.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to access this channel")
    return channel


@router.put("/{channel_id}", response_model=ChannelResponse)
def update_channel(
    channel_id: str,
    payload: ChannelUpdate,
    current_user: User = Depends(get_current_user),
    scope: AccessScope = Depends(get_access_scope),
    db: Session = Depends(get_db),
    repo: ChannelRepository = Depends(get_channel_repo)
):
    """Update a channel."""
    channel = repo.get_by_id(channel_id)
    if not channel:
        raise HTTPException(status_code=404, detail="Channel not found")
    if channel.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to edit this channel")
    if getattr(payload, "project_id", None):
        TenantGuard.project(db, payload.project_id, scope)

    return repo.update(channel, payload)


@router.delete("/{channel_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_channel(
    channel_id: str,
    current_user: User = Depends(get_current_user),
    repo: ChannelRepository = Depends(get_channel_repo)
):
    """Delete a channel."""
    channel = repo.get_by_id(channel_id)
    if not channel:
        raise HTTPException(status_code=404, detail="Channel not found")
    if channel.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to delete this channel")

    repo.delete(channel_id)
    return None


@router.post("/{channel_id}/api-keys", response_model=ChannelApiKeyCreatedResponse, status_code=status.HTTP_201_CREATED)
def create_channel_api_key(
    channel_id: str,
    payload: ChannelApiKeyCreate,
    current_user: User = Depends(get_current_user),
    repo: ChannelRepository = Depends(get_channel_repo)
):
    """Create a new API Key for a channel. The raw API key is returned ONCE."""
    channel = repo.get_by_id(channel_id)
    if not channel:
        raise HTTPException(status_code=404, detail="Channel not found")
    if channel.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to edit this channel")

    credential, raw_key = repo.create_api_key(channel_id, payload.key_type, name=payload.name or "Primary")

    return ChannelApiKeyCreatedResponse(
        id=credential.id,
        key_id=credential.key_id,
        key_type=credential.key_type,
        name=credential.name,
        raw_key=raw_key,
        created_at=credential.created_at,
    )


@router.post("/{channel_id}/api-keys/{key_id}/rotate", response_model=ChannelApiKeyCreatedResponse)
def rotate_channel_api_key(
    channel_id: str,
    key_id: str,
    current_user: User = Depends(get_current_user),
    repo: ChannelRepository = Depends(get_channel_repo)
):
    """Rotate an API key. Returns a brand new raw API key ONCE and revokes the old key."""
    channel = repo.get_by_id(channel_id)
    if not channel:
        raise HTTPException(status_code=404, detail="Channel not found")
    if channel.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to edit this channel")

    new_credential, raw_key = repo.rotate_api_key(channel_id, key_id)

    return ChannelApiKeyCreatedResponse(
        id=new_credential.id,
        key_id=new_credential.key_id,
        key_type=new_credential.key_type,
        name=new_credential.name,
        raw_key=raw_key,
        created_at=new_credential.created_at,
    )


@router.post("/{channel_id}/api-keys/{key_type}/regenerate", response_model=ChannelApiKeyCreatedResponse)
def regenerate_api_key(
    channel_id: str,
    key_type: str,
    current_user: User = Depends(get_current_user),
    repo: ChannelRepository = Depends(get_channel_repo)
):
    """Legacy endpoint: Regenerate a specific API key for a channel and return raw key once."""
    channel = repo.get_by_id(channel_id)
    if not channel:
        raise HTTPException(status_code=404, detail="Channel not found")
    if channel.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to edit this channel")

    if key_type.lower() not in ["read", "write"]:
        raise HTTPException(status_code=400, detail="Invalid key type. Must be 'read' or 'write'")

    enum_type = ApiKeyType.READ if key_type.lower() == "read" else ApiKeyType.WRITE
    new_credential, raw_key = repo.regenerate_api_key(channel_id, enum_type)

    return ChannelApiKeyCreatedResponse(
        id=new_credential.id,
        key_id=new_credential.key_id,
        key_type=new_credential.key_type,
        name=new_credential.name,
        raw_key=raw_key,
        created_at=new_credential.created_at,
    )
