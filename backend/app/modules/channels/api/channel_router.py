from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.core.auth import get_current_user
from app.modules.users.models.user import User

from app.modules.channels.schemas.channel import ChannelCreate, ChannelUpdate, ChannelResponse
from app.modules.channels.repositories.channel_repository import ChannelRepository

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
    repo: ChannelRepository = Depends(get_channel_repo)
):
    """Create a new channel."""
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
    # For Sprint 27.1, we only allow the owner to read the channel details. Public access is later.
    if channel.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to access this channel")
    return channel

@router.put("/{channel_id}", response_model=ChannelResponse)
def update_channel(
    channel_id: str,
    payload: ChannelUpdate,
    current_user: User = Depends(get_current_user),
    repo: ChannelRepository = Depends(get_channel_repo)
):
    """Update a channel."""
    channel = repo.get_by_id(channel_id)
    if not channel:
        raise HTTPException(status_code=404, detail="Channel not found")
    if channel.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to edit this channel")
    
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

@router.post("/{channel_id}/api-keys/{key_type}/regenerate", response_model=ChannelResponse)
def regenerate_api_key(
    channel_id: str,
    key_type: str,
    current_user: User = Depends(get_current_user),
    repo: ChannelRepository = Depends(get_channel_repo)
):
    """Regenerate a specific API key for a channel."""
    channel = repo.get_by_id(channel_id)
    if not channel:
        raise HTTPException(status_code=404, detail="Channel not found")
    if channel.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to edit this channel")
    
    if key_type not in ["read", "write"]:
        raise HTTPException(status_code=400, detail="Invalid key type. Must be 'read' or 'write'")

    from app.modules.channels.models.channel import ApiKeyType
    enum_type = ApiKeyType.READ if key_type == "read" else ApiKeyType.WRITE
    repo.regenerate_api_key(channel_id, enum_type)
    
    return repo.get_by_id(channel_id)
