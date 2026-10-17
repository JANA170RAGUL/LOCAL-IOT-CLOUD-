"""
FastAPI dependencies for telemetry endpoints.
"""

from fastapi import Depends, Header, HTTPException, status
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.modules.devices.models.device import Device
from app.modules.devices.security.device_authenticator import (
    DeviceAuthenticator,
)


def get_authenticated_device(
    x_device_key: str | None = Header(
        default=None,
        alias="X-Device-Key",
    ),
    db: Session = Depends(get_db),
) -> Device:
    """
    Authenticate a physical IoT device using its device credential.

    The API key is expected in:

        X-Device-Key: liot_dvc_<key-id>.<secret>
    """

    if not x_device_key:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Device credentials required.",
            headers={
                "WWW-Authenticate": "DeviceKey",
            },
        )

    authenticator = DeviceAuthenticator()

    return authenticator.authenticate(
        db,
        x_device_key,
    )
