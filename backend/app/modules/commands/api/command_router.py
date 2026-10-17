from typing import List
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.modules.commands.schemas.command import CommandCreate, CommandRead
from app.modules.commands.services.command_service import CommandService
from app.modules.licensing.dependencies import require_feature

from app.core.access_scope import AccessScope, get_access_scope
from app.core.tenant_guard import TenantGuard

router = APIRouter(
    prefix="/commands", 
    tags=["Commands"],
    dependencies=[Depends(require_feature("remote_commands"))]
)

@router.post("/{device_id}", response_model=CommandRead)
def issue_command(
    device_id: str,
    cmd_in: CommandCreate,
    db: Session = Depends(get_db),
    scope: AccessScope = Depends(get_access_scope),
):
    """
    Issue a new command to a device.
    """
    TenantGuard.device(db, device_id, scope)
    return CommandService.enqueue_command(db, device_id, cmd_in)

@router.get("/device/{device_id}", response_model=List[CommandRead])
def get_device_commands(
    device_id: str,
    limit: int = Query(50, ge=1, le=100),
    skip: int = Query(0, ge=0),
    db: Session = Depends(get_db),
    scope: AccessScope = Depends(get_access_scope),
):
    """
    Retrieve command history for a specific device.
    """
    TenantGuard.device(db, device_id, scope)
    return CommandService.get_command_history(db, device_id, limit=limit, skip=skip)

@router.post("/{command_id}/cancel", response_model=CommandRead)
def cancel_command(
    command_id: str,
    db: Session = Depends(get_db),
    scope: AccessScope = Depends(get_access_scope),
):
    """
    Cancel a queued device command.
    """
    TenantGuard.command(db, command_id, scope)
    return CommandService.cancel_command(db, command_id)
