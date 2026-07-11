"""
app/modules/gateways/api/gateway_router.py

FastAPI router for the Gateways endpoints.

Mounted at: /
This router handles hierarchical project-scoped gateway endpoints
as well as gateway-specific endpoints.

Endpoints
---------
POST   /projects/{project_id}/gateways/    Create a new gateway
GET    /projects/{project_id}/gateways/    List gateways for a project
GET    /gateways/{gateway_id}              Get a single gateway by UUID
PATCH  /gateways/{gateway_id}              Partially update a gateway (PATCH)
PUT    /gateways/{gateway_id}              Partially update a gateway (PUT alias)
DELETE /gateways/{gateway_id}              Soft-delete a gateway
"""

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.core.constants import DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE
from app.database.session import get_db
from app.modules.gateways.dependencies import get_gateway_service
from app.modules.gateways.schemas.gateway import (
    GatewayCreate,
    GatewayFilter,
    GatewayListResponse,
    GatewayResponse,
    GatewayUpdate,
)
from app.modules.gateways.services.gateway_service import GatewayService

router = APIRouter(
    tags=["Gateways"],
)


# ---------------------------------------------------------------------------
# POST /projects/{project_id}/gateways/
# ---------------------------------------------------------------------------

@router.post(
    "/projects/{project_id}/gateways/",
    response_model=GatewayResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create gateway",
    description="Create a new gateway under a specific project.",
)
def create_gateway(
    project_id: str,
    payload: GatewayCreate,
    db: Session = Depends(get_db),
    svc: GatewayService = Depends(get_gateway_service),
) -> GatewayResponse:
    return svc.create_gateway(db, project_id, payload)


# ---------------------------------------------------------------------------
# GET /projects/{project_id}/gateways/
# ---------------------------------------------------------------------------

@router.get(
    "/projects/{project_id}/gateways/",
    response_model=GatewayListResponse,
    summary="List gateways",
    description="List all gateways belonging to a project with optional search, status, and protocol filtering.",
)
def list_gateways(
    project_id: str,
    search: str | None = Query(None, description="Keyword search across name and code"),
    gateway_status: str | None = Query(
        None,
        alias="status",
        pattern="^(ACTIVE|INACTIVE|SUSPENDED|TRIAL|EXPIRED)$",
        description="Filter by gateway lifecycle status",
    ),
    protocol: str | None = Query(
        None,
        pattern="^(MQTT|HTTP|COAP|WEBSOCKET|MODBUS|OPC_UA)$",
        description="Filter by connection protocol",
    ),
    page: int = Query(1, ge=1, description="Page number (1-indexed)"),
    page_size: int = Query(DEFAULT_PAGE_SIZE, ge=1, le=MAX_PAGE_SIZE, description="Items per page"),
    db: Session = Depends(get_db),
    svc: GatewayService = Depends(get_gateway_service),
) -> GatewayListResponse:
    filters = GatewayFilter(
        search=search,
        status=gateway_status,
        protocol=protocol,
        page=page,
        page_size=page_size,
    )
    return svc.list_gateways(db, project_id, filters)


# ---------------------------------------------------------------------------
# GET /gateways/{gateway_id}
# ---------------------------------------------------------------------------

@router.get(
    "/gateways/{gateway_id}",
    response_model=GatewayResponse,
    summary="Get gateway",
    description="Fetch details of a single gateway by UUID.",
)
def get_gateway(
    gateway_id: str,
    db: Session = Depends(get_db),
    svc: GatewayService = Depends(get_gateway_service),
) -> GatewayResponse:
    return svc.get_gateway(db, gateway_id)


# ---------------------------------------------------------------------------
# PATCH /gateways/{gateway_id}
# ---------------------------------------------------------------------------

@router.patch(
    "/gateways/{gateway_id}",
    response_model=GatewayResponse,
    summary="Partially update gateway (PATCH)",
    description="Partially update a gateway's fields. Only fields provided in the body are modified.",
)
def patch_gateway(
    gateway_id: str,
    payload: GatewayUpdate,
    db: Session = Depends(get_db),
    svc: GatewayService = Depends(get_gateway_service),
) -> GatewayResponse:
    return svc.update_gateway(db, gateway_id, payload)


# ---------------------------------------------------------------------------
# PUT /gateways/{gateway_id}
# ---------------------------------------------------------------------------

@router.put(
    "/gateways/{gateway_id}",
    response_model=GatewayResponse,
    summary="Update gateway (PUT)",
    description="Update a gateway's fields. Works exactly like PATCH (partial update).",
)
def put_gateway(
    gateway_id: str,
    payload: GatewayUpdate,
    db: Session = Depends(get_db),
    svc: GatewayService = Depends(get_gateway_service),
) -> GatewayResponse:
    return svc.update_gateway(db, gateway_id, payload)


# ---------------------------------------------------------------------------
# DELETE /gateways/{gateway_id}
# ---------------------------------------------------------------------------

@router.delete(
    "/gateways/{gateway_id}",
    summary="Deactivate gateway",
    description="Soft-delete a gateway. Sets is_active=False and status=INACTIVE.",
    status_code=status.HTTP_200_OK,
)
def delete_gateway(
    gateway_id: str,
    db: Session = Depends(get_db),
    svc: GatewayService = Depends(get_gateway_service),
) -> dict:
    return svc.deactivate_gateway(db, gateway_id)
