from starlette.status import HTTP_500_INTERNAL_SERVER_ERROR
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database.session import get_db

from app.core.access_scope import AccessScope, get_access_scope
from app.core.tenant_guard import TenantGuard

from app.modules.device_provisioning.schemas.provisioning import (
    ConnectionTestResponse,
    DeviceConnectionCreate,
    DeviceConnectionResponse,
    DeviceConnectionUpdate,
)
from app.modules.device_provisioning.services.connection_service import (
    ConnectionService,
)
from app.modules.device_provisioning.services.discovery_service import (
    DiscoveryService,
)
from app.modules.device_provisioning.services.provisioning_service import (
    ProvisioningService,
)


router = APIRouter(
    tags=["Device Provisioning"],
)


# ---------------------------------------------------------------------------
# Dependency
# ---------------------------------------------------------------------------

def get_connection_service(
    db: Session = Depends(get_db),
) -> ConnectionService:
    return ConnectionService(db)


# ---------------------------------------------------------------------------
# POST /devices/{device_id}/connection
# ---------------------------------------------------------------------------

@router.post(
    "/devices/{device_id}/connection",
    response_model=DeviceConnectionResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Configure device connection",
    description="Create SSH connection configuration for a device.",
)
def create_connection(
    device_id: str,
    payload: DeviceConnectionCreate,
    db: Session = Depends(get_db),
    svc: ConnectionService = Depends(get_connection_service),
    scope: AccessScope = Depends(get_access_scope),
) -> DeviceConnectionResponse:

    # Verify that the authenticated user can access this device.
    TenantGuard.device(db, device_id, scope)

    try:
        return svc.create_connection(
            device_id=device_id,
            data=payload,
        )

    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        )


# ---------------------------------------------------------------------------
# GET /devices/{device_id}/connection
# ---------------------------------------------------------------------------

@router.get(
    "/devices/{device_id}/connection",
    response_model=DeviceConnectionResponse,
    summary="Get device connection",
    description="Get the SSH connection configuration for a device.",
)
def get_connection(
    device_id: str,
    db: Session = Depends(get_db),
    svc: ConnectionService = Depends(get_connection_service),
    scope: AccessScope = Depends(get_access_scope),
) -> DeviceConnectionResponse:

    TenantGuard.device(db, device_id, scope)

    connection = svc.get_connection(device_id)

    if connection is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Connection configuration not found",
        )

    return connection


# ---------------------------------------------------------------------------
# PATCH /devices/{device_id}/connection
# ---------------------------------------------------------------------------

@router.patch(
    "/devices/{device_id}/connection",
    response_model=DeviceConnectionResponse,
    summary="Update device connection",
    description="Update the SSH connection configuration for a device.",
)
def update_connection(
    device_id: str,
    payload: DeviceConnectionUpdate,
    db: Session = Depends(get_db),
    svc: ConnectionService = Depends(get_connection_service),
    scope: AccessScope = Depends(get_access_scope),
) -> DeviceConnectionResponse:

    TenantGuard.device(db, device_id, scope)

    try:
        return svc.update_connection(
            device_id=device_id,
            data=payload,
        )

    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(exc),
        )


# ---------------------------------------------------------------------------
# DELETE /devices/{device_id}/connection
# ---------------------------------------------------------------------------

@router.delete(
    "/devices/{device_id}/connection",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Remove device connection",
    description="Deactivate the SSH connection configuration for a device.",
)
def delete_connection(
    device_id: str,
    db: Session = Depends(get_db),
    svc: ConnectionService = Depends(get_connection_service),
    scope: AccessScope = Depends(get_access_scope),
):
    TenantGuard.device(db, device_id, scope)

    try:
        svc.delete_connection(device_id)

    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(exc),
        )


# ---------------------------------------------------------------------------
# POST /devices/{device_id}/connection/test
# ---------------------------------------------------------------------------

@router.post(
    "/devices/{device_id}/connection/test",
    response_model=ConnectionTestResponse,
    summary="Test device connection",
    description="Validate the configured connection for a device.",
)
def test_connection(
    device_id: str,
    db: Session = Depends(get_db),
    svc: ConnectionService = Depends(get_connection_service),
    scope: AccessScope = Depends(get_access_scope),
) -> ConnectionTestResponse:

    TenantGuard.device(db, device_id, scope)

    try:
        return svc.test_connection(device_id)

    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(exc),
        )

def get_discovery_service(
    db: Session = Depends(get_db),
) -> DiscoveryService:
    return DiscoveryService(db)   
@router.get(
    "/devices/{device_id}/agent",
    status_code=status.HTTP_200_OK,
)
def get_device_agent(
    device_id: str,
    db: Session = Depends(get_db),
    svc: DiscoveryService = Depends(get_discovery_service),
    scope: AccessScope = Depends(get_access_scope),
):
    TenantGuard.device(db, device_id, scope)

    try:
        return svc.get_agent(device_id)
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Device agent not found.",
        )
@router.post(
    "/devices/{device_id}/agent/detect",
    status_code=status.HTTP_200_OK,
)
def detect_device_agent(
    device_id: str,
    db: Session = Depends(get_db),
    svc: DiscoveryService = Depends(get_discovery_service),
    scope: AccessScope = Depends(get_access_scope),
):
    TenantGuard.device(db, device_id, scope)

    try:
        agent = svc.detect_or_install_agent(device_id)
        return agent
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        )

@router.post(
    "/devices/{device_id}/discover",
    status_code=status.HTTP_200_OK,
)
def discover_device(
    device_id: str,
    db: Session = Depends(get_db),
    scope: AccessScope = Depends(get_access_scope),
):
    TenantGuard.device(db, device_id, scope)
    service = DiscoveryService(db)

    return service.run_hardware_discovery(device_id)


@router.post(
    "/devices/{device_id}/identify",
    status_code=status.HTTP_200_OK,
    summary="Run Level 2 Hardware Identification",
)
def identify_device_hardware(
    device_id: str,
    db: Session = Depends(get_db),
    scope: AccessScope = Depends(get_access_scope),
):
    TenantGuard.device(db, device_id, scope)
    service = DiscoveryService(db)

    return service.identify_hardware(device_id)
@router.get(
    "/devices/{device_id}/hardware",
    status_code=status.HTTP_200_OK,
)
def get_device_hardware(
    device_id: str,
    db: Session = Depends(get_db),
    scope: AccessScope = Depends(get_access_scope),
):
    TenantGuard.device(db, device_id, scope)
    service = DiscoveryService(db)

    return service.list_hardware(device_id)
def get_provisioning_service(
    db: Session = Depends(get_db),
) -> ProvisioningService:
    return ProvisioningService(db)
@router.post(
    "/devices/{device_id}/provision",
    status_code=status.HTTP_200_OK,
)
def provision_device(
    device_id: str,
    db: Session = Depends(get_db),
    service : ProvisioningService = Depends(get_provisioning_service),
    scope: AccessScope = Depends(get_access_scope),
):
    TenantGuard.device(db, device_id, scope)
    try:
        return service.start_provisioning(
            device_id=device_id,
            job_type="FULL_PROVISION",
        )
    except Exception as exc:
        raise HTTPException(
            status_code=HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(exc),
        )
@router.get(
    "/devices/{device_id}/provisioning/{job_id}",
    status_code=status.HTTP_200_OK,
)
def get_device_provisioning_job(
    device_id: str,
    job_id: str,
    db: Session = Depends(get_db),
    service : ProvisioningService = Depends(get_provisioning_service),
    scope: AccessScope = Depends(get_access_scope),
):
    TenantGuard.device(db, device_id, scope)
    job = service.get_job(job_id)
    if job is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Provisioning Job not found.",
        )
    if job.device_id != device_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied.",
        )
    return job  
