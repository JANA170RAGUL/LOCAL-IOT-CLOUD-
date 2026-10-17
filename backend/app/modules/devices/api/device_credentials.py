from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    status,
)
from sqlalchemy.orm import Session

from app.core.access_scope import (
    AccessScope,
    get_access_scope,
)
from app.core.permissions import Role
from app.core.tenant_guard import TenantGuard
from app.database.session import get_db

from app.modules.devices.schemas.device_credential import (
    DeviceCredentialCreate,
    DeviceCredentialCreated,
    DeviceCredentialRead,
)
from app.modules.devices.services.device_credential_service import (
    DeviceCredentialService,
)


router = APIRouter(
    prefix="/devices",
    tags=["Device Credentials"],
)


def require_device_admin(
    scope: AccessScope,
) -> None:

    if scope.role not in {
        Role.SUPER_ADMIN.value,
        Role.ORG_ADMIN.value,
    }:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=(
                "You are not allowed to manage "
                "device credentials."
            ),
        )


@router.post(
    "/{device_id}/credentials",
    response_model=DeviceCredentialCreated,
    status_code=status.HTTP_201_CREATED,
)
def create_device_credential(
    device_id: str,
    payload: DeviceCredentialCreate,
    db: Session = Depends(get_db),
    scope: AccessScope = Depends(get_access_scope),
):

    require_device_admin(scope)

    TenantGuard.device(
        db,
        device_id,
        scope,
    )

    service = DeviceCredentialService()

    credential, raw_key = service.create(
        db,
        device_id,
        payload,
    )

    # Validate the database fields first.
    credential_data = DeviceCredentialRead.model_validate(
        credential
    ).model_dump()

    # Include the raw key before validating the complete response.
    return DeviceCredentialCreated(
        **credential_data,
        api_key=raw_key,
    )
 

@router.get(
    "/{device_id}/credentials",
    response_model=list[DeviceCredentialRead],
)
def list_device_credentials(
    device_id: str,
    db: Session = Depends(get_db),
    scope: AccessScope = Depends(get_access_scope),
):

    require_device_admin(scope)

    TenantGuard.device(
        db,
        device_id,
        scope,
    )

    service = DeviceCredentialService()

    return service.list_for_device(
        db,
        device_id,
    )


@router.post(
    "/{device_id}/credentials/{credential_id}/rotate",
    response_model=DeviceCredentialCreated,
)
def rotate_device_credential(
    device_id: str,
    credential_id: str,
    db: Session = Depends(get_db),
    scope: AccessScope = Depends(get_access_scope),
):

    require_device_admin(scope)

    TenantGuard.device(
        db,
        device_id,
        scope,
    )

    service = DeviceCredentialService()

    credential, raw_key = service.rotate(
        db,
        device_id,
        credential_id,
    )

    # Validate the database fields first.
    credential_data = DeviceCredentialRead.model_validate(
        credential
    ).model_dump()

    # Include the raw key before validating the complete response.
    return DeviceCredentialCreated(
        **credential_data,
        api_key=raw_key,
    )


@router.delete(
    "/{device_id}/credentials/{credential_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def revoke_device_credential(
    device_id: str,
    credential_id: str,
    db: Session = Depends(get_db),
    scope: AccessScope = Depends(get_access_scope),
):

    require_device_admin(scope)

    TenantGuard.device(
        db,
        device_id,
        scope,
    )

    service = DeviceCredentialService()

    service.revoke(
        db,
        device_id,
        credential_id,
    )

    return None
