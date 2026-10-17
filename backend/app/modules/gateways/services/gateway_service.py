"""
app/modules/gateways/services/gateway_service.py

Business logic for the Gateway module.

Naming convention:
  Service methods are business-oriented (e.g. create_gateway, deactivate_gateway).

Responsibilities:
  - Validate uniqueness constraints (code per project)
  - Orchestrate repository calls inside transactions
  - Emit structured audit log entries
  - Raise domain exceptions on violations
"""

import logging
from math import ceil

from sqlalchemy.orm import Session

from app.modules.gateways.models.gateway import Gateway
from app.modules.gateways.repositories.gateway_repository import GatewayRepository
from app.modules.gateways.schemas.gateway import (
    GatewayCreate,
    GatewayFilter,
    GatewayListResponse,
    GatewaySummary,
    GatewayUpdate,
)
from app.shared.exceptions.gateway import (
    GatewayCodeTaken,
    GatewayNotFound,
)
from app.shared.services.base_service import BaseService

logger = logging.getLogger(__name__)


from app.modules.licensing.features import LicenseFeature
from app.modules.licensing.services.license_policy import license_policy
from app.modules.licensing.services.license_usage import license_usage


class GatewayService(BaseService[Gateway, GatewayRepository]):

    def __init__(self):
        super().__init__(GatewayRepository())

    # ------------------------------------------------------------------
    # create_gateway  —  validate → build → persist → log
    # ------------------------------------------------------------------

    def create_gateway(
        self,
        db: Session,
        project_id: str,
        payload: GatewayCreate,
    ) -> Gateway:
        """
        Create a new gateway under the given project.

        Raises:
            GatewayCodeTaken — if code already used within this project
        """
        snapshot = license_policy.get_snapshot(db)
        current_count = license_usage.count_gateways(db)
        license_policy.ensure_capacity(
            snapshot,
            LicenseFeature.GATEWAYS,
            current_count=current_count,
        )

        if self.repository.exists_by_code(db, project_id, payload.code):
            raise GatewayCodeTaken()

        gateway = Gateway(
            project_id=project_id,
            **payload.model_dump(),
        )

        result = self.repository.create(db, gateway)

        logger.info(
            "gateway.created",
            extra={
                "gateway_id": str(result.id),
                "project_id": project_id,
                "code": result.code,
            },
        )

        return result

    # ------------------------------------------------------------------
    # get_gateway  —  fetch by ID with not-found guard
    # ------------------------------------------------------------------

    def get_gateway(self, db: Session, gateway_id: str) -> Gateway:
        """
        Fetch a gateway by primary key.

        Raises:
            GatewayNotFound — if no record exists for the given ID
        """
        gateway = self.repository.get_by_id(db, gateway_id)

        if not gateway:
            raise GatewayNotFound()

        return gateway

    # ------------------------------------------------------------------
    # get_gateway_by_code  —  slug-based lookup
    # ------------------------------------------------------------------

    def get_gateway_by_code(
        self,
        db: Session,
        project_id: str,
        code: str,
    ) -> Gateway:
        """
        Fetch a gateway by (project_id, code).

        Raises:
            GatewayNotFound — if no record matches
        """
        gateway = self.repository.get_by_code(db, project_id, code)

        if not gateway:
            raise GatewayNotFound()

        return gateway

    # ------------------------------------------------------------------
    # list_gateways  —  paginated + search + status/protocol filter
    # ------------------------------------------------------------------

    def list_gateways(
        self,
        db: Session,
        project_id: str,
        filters: GatewayFilter,
    ) -> GatewayListResponse:
        """
        Return a paginated list of gateways belonging to a project.

        Supports:
          - keyword search  (name / code)
          - status filter   (ACTIVE | INACTIVE | SUSPENDED | TRIAL | EXPIRED)
          - protocol filter (MQTT | HTTP | COAP | WEBSOCKET | MODBUS | OPC_UA)
          - pagination      (page, page_size)
        """
        items, total = self.repository.list_by_project(
            db,
            project_id=project_id,
            keyword=filters.search,
            status=filters.status,
            protocol=filters.protocol,
            page=filters.page,
            page_size=filters.page_size,
        )

        return GatewayListResponse(
            total=total,
            page=filters.page,
            page_size=filters.page_size,
            total_pages=ceil(total / filters.page_size) if total else 1,
            items=[GatewaySummary.model_validate(item) for item in items],
        )

    # ------------------------------------------------------------------
    # update_gateway  —  fetch → patch → persist → log
    # ------------------------------------------------------------------

    def update_gateway(
        self,
        db: Session,
        gateway_id: str,
        payload: GatewayUpdate,
    ) -> Gateway:
        """
        Partially update a gateway.

        Only fields present in the payload are written (exclude_unset).

        Raises:
            GatewayNotFound — if gateway does not exist
        """
        gateway = self.get_gateway(db, gateway_id)

        update_data = payload.model_dump(exclude_unset=True)

        for key, value in update_data.items():
            setattr(gateway, key, value)

        result = self.repository.update(db, gateway)

        logger.info(
            "gateway.updated",
            extra={
                "gateway_id": str(result.id),
                "fields": list(update_data.keys()),
            },
        )

        return result

    # ------------------------------------------------------------------
    # deactivate_gateway  —  soft-delete only (no physical removal)
    # ------------------------------------------------------------------

    def deactivate_gateway(self, db: Session, gateway_id: str) -> dict:
        """
        Soft-delete a gateway.

        Sets is_active = False and status = "INACTIVE".
        The record is preserved for audit trails and FK integrity.

        Raises:
            GatewayNotFound — if gateway does not exist
        """
        gateway = self.get_gateway(db, gateway_id)

        self.repository.deactivate(db, gateway)

        logger.info(
            "gateway.deactivated",
            extra={"gateway_id": gateway_id},
        )

        return {"message": "Gateway deactivated successfully."}
