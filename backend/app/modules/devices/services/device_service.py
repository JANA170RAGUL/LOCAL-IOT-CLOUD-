"""
app/modules/devices/services/device_service.py

Business logic for the Device module.

Naming convention:
  Service methods are business-oriented (e.g. create_device, deactivate_device).

Responsibilities:
  - Validate uniqueness constraints (code per gateway)
  - Orchestrate repository calls inside transactions
  - Emit structured audit log entries
  - Raise domain exceptions on violations
"""

import logging
from math import ceil

from sqlalchemy.orm import Session

from app.modules.devices.models.device import Device
from app.modules.devices.repositories.device_repository import DeviceRepository
from app.modules.devices.schemas.device import (
    DeviceCreate,
    DeviceFilter,
    DeviceListResponse,
    DeviceSummary,
    DeviceUpdate,
)
from app.shared.exceptions.device import (
    DeviceCodeTaken,
    DeviceNotFound,
)
from app.shared.services.base_service import BaseService

logger = logging.getLogger(__name__)


from app.modules.licensing.features import LicenseFeature
from app.modules.licensing.services.license_policy import license_policy
from app.modules.licensing.services.license_usage import license_usage


class DeviceService(BaseService[Device, DeviceRepository]):

    def __init__(self):
        super().__init__(DeviceRepository())

    # ------------------------------------------------------------------
    # create_device  —  validate → build → persist → log
    # ------------------------------------------------------------------

    def create_device(
        self,
        db: Session,
        gateway_id: str,
        payload: DeviceCreate,
    ) -> Device:
        """
        Create a new device under the given gateway.

        Raises:
            DeviceCodeTaken — if code already used within this gateway
        """
        snapshot = license_policy.get_snapshot(db)
        current_count = license_usage.count_devices(db)
        license_policy.ensure_capacity(
            snapshot,
            LicenseFeature.DEVICES,
            current_count=current_count,
        )

        if self.repository.exists_by_code(db, gateway_id, payload.code):
            raise DeviceCodeTaken()

        device = Device(
            gateway_id=gateway_id,
            **payload.model_dump(),
        )

        result = self.repository.create(db, device)

        # Auto-create initial primary API key credential for the device
        try:
            from app.modules.devices.services.device_credential_service import DeviceCredentialService
            from app.modules.devices.schemas.device_credential import DeviceCredentialCreate

            cred_svc = DeviceCredentialService()
            _, raw_key = cred_svc.create(
                db,
                result.id,
                DeviceCredentialCreate(name="Default Primary Key"),
            )
            setattr(result, "api_key", raw_key)
        except Exception as cred_err:
            logger.warning(f"Could not auto-generate credential for device {result.id}: {cred_err}")

        logger.info(
            "device.created",
            extra={
                "device_id": str(result.id),
                "gateway_id": gateway_id,
                "code": result.code,
            },
        )

        return result

    # ------------------------------------------------------------------
    # get_device  —  fetch by ID with not-found guard
    # ------------------------------------------------------------------

    def get_device(self, db: Session, device_id: str) -> Device:
        """
        Fetch a device by primary key.

        Raises:
            DeviceNotFound — if no record exists for the given ID
        """
        device = self.repository.get_by_id(db, device_id)

        if not device:
            raise DeviceNotFound()

        return device

    # ------------------------------------------------------------------
    # get_device_by_code  —  slug-based lookup
    # ------------------------------------------------------------------

    def get_device_by_code(
        self,
        db: Session,
        gateway_id: str,
        code: str,
    ) -> Device:
        """
        Fetch a device by (gateway_id, code).

        Raises:
            DeviceNotFound — if no record matches
        """
        device = self.repository.get_by_code(db, gateway_id, code)

        if not device:
            raise DeviceNotFound()

        return device

    # ------------------------------------------------------------------
    # list_devices  —  paginated + search + status/device_type filter
    # ------------------------------------------------------------------

    def list_devices(
        self,
        db: Session,
        gateway_id: str,
        filters: DeviceFilter,
    ) -> DeviceListResponse:
        """
        Return a paginated list of devices belonging to a gateway.

        Supports:
          - keyword search  (name / code)
          - status filter   (ACTIVE | INACTIVE | SUSPENDED | TRIAL | EXPIRED)
          - device_type     (exact string match)
          - pagination      (page, page_size)
        """
        items, total = self.repository.list_by_gateway(
            db,
            gateway_id=gateway_id,
            keyword=filters.search,
            status=filters.status,
            device_type=filters.device_type,
            page=filters.page,
            page_size=filters.page_size,
        )

        return DeviceListResponse(
            total=total,
            page=filters.page,
            page_size=filters.page_size,
            total_pages=ceil(total / filters.page_size) if total else 1,
            items=[DeviceSummary.model_validate(item) for item in items],
        )

    # ------------------------------------------------------------------
    # update_device  —  fetch → patch → persist → log
    # ------------------------------------------------------------------

    def update_device(
        self,
        db: Session,
        device_id: str,
        payload: DeviceUpdate,
    ) -> Device:
        """
        Partially update a device.

        Only fields present in the payload are written (exclude_unset).

        Raises:
            DeviceNotFound — if device does not exist
        """
        device = self.get_device(db, device_id)

        update_data = payload.model_dump(exclude_unset=True)

        for key, value in update_data.items():
            setattr(device, key, value)

        result = self.repository.update(db, device)

        logger.info(
            "device.updated",
            extra={
                "device_id": str(result.id),
                "fields": list(update_data.keys()),
            },
        )

        return result

    # ------------------------------------------------------------------
    # deactivate_device  —  soft-delete only (no physical removal)
    # ------------------------------------------------------------------

    def deactivate_device(self, db: Session, device_id: str) -> dict:
        """
        Soft-delete a device.

        Sets is_active = False and status = "INACTIVE".
        The record is preserved for audit trails and FK integrity.

        Raises:
            DeviceNotFound — if device does not exist
        """
        device = self.get_device(db, device_id)

        self.repository.deactivate(db, device)

        logger.info(
            "device.deactivated",
            extra={"device_id": device_id},
        )

        return {"message": "Device deactivated successfully."}
