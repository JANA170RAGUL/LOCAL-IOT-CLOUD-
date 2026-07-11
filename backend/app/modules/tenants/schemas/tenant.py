"""
app/modules/tenants/schemas/tenant.py

Pydantic schemas for the Tenant module.

Schema hierarchy
----------------
TenantBase          — shared fields (Create + Response)
TenantCreate        — input for POST /tenants/
TenantUpdate        — input for PUT /tenants/{id}  (all optional)
TenantResponse      — full record returned to the caller
TenantSummary       — lightweight item inside list responses
TenantFilter        — query params for GET /tenants/
TenantListResponse  — paginated list envelope
"""

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, EmailStr, Field

# ---------------------------------------------------------------------------
# Valid status values (mirrors the model column)
# ---------------------------------------------------------------------------

VALID_STATUSES = {"ACTIVE", "INACTIVE", "SUSPENDED", "TRIAL", "EXPIRED"}
STATUS_PATTERN = "^(ACTIVE|INACTIVE|SUSPENDED|TRIAL|EXPIRED)$"


# ---------------------------------------------------------------------------
# Base — shared fields
# ---------------------------------------------------------------------------

class TenantBase(BaseModel):
    # Identity
    code: str = Field(..., min_length=2, max_length=20, description="Short unique code within the organization")
    name: str = Field(..., min_length=3, max_length=150)
    description: Optional[str] = Field(None, description="Optional summary of the tenant")
    logo_url: Optional[str] = Field(None, max_length=500)

    # Contact
    email: EmailStr
    phone: Optional[str] = Field(None, max_length=20)
    website: Optional[str] = Field(None, max_length=255)

    # Location
    address: Optional[str] = None
    city: Optional[str] = Field(None, max_length=100)
    state: Optional[str] = Field(None, max_length=100)
    country: Optional[str] = Field(None, max_length=100)

    # Locale
    timezone: str = Field("Asia/Kolkata", max_length=100)


# ---------------------------------------------------------------------------
# Create — POST /organizations/{org_id}/tenants/
# ---------------------------------------------------------------------------

class TenantCreate(TenantBase):
    """
    Payload for creating a new tenant.

    organization_id is supplied by the URL path parameter, not the body.
    status is declared here (not TenantBase) so model_dump() always
    includes it — prevents the ORM from falling back to the column default.
    """
    status: str = Field(
        "ACTIVE",
        pattern=STATUS_PATTERN,
        description="Initial lifecycle status",
    )


# ---------------------------------------------------------------------------
# Update — PUT /tenants/{id}  (PATCH semantics — all fields optional)
# ---------------------------------------------------------------------------

class TenantUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=3, max_length=150)
    description: Optional[str] = None
    logo_url: Optional[str] = Field(None, max_length=500)

    email: Optional[EmailStr] = None
    phone: Optional[str] = Field(None, max_length=20)
    website: Optional[str] = Field(None, max_length=255)

    address: Optional[str] = None
    city: Optional[str] = Field(None, max_length=100)
    state: Optional[str] = Field(None, max_length=100)
    country: Optional[str] = Field(None, max_length=100)

    timezone: Optional[str] = Field(None, max_length=100)
    status: Optional[str] = Field(None, pattern=STATUS_PATTERN)


# ---------------------------------------------------------------------------
# Response — full record
# ---------------------------------------------------------------------------

class TenantResponse(TenantBase):
    model_config = ConfigDict(from_attributes=True)

    id: str
    organization_id: str
    status: str

    # Audit
    created_at: datetime
    updated_at: datetime
    is_active: bool


# ---------------------------------------------------------------------------
# Summary — lightweight item in list responses
# ---------------------------------------------------------------------------

class TenantSummary(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    organization_id: str
    code: str
    name: str
    email: EmailStr
    status: str
    is_active: bool


# ---------------------------------------------------------------------------
# Filter — query parameters for GET /tenants/
# ---------------------------------------------------------------------------

class TenantFilter(BaseModel):
    """Query parameters accepted by the list_tenants endpoint."""
    search: Optional[str] = Field(None, description="Keyword search on name, code, email")
    status: Optional[str] = Field(None, pattern=STATUS_PATTERN, description="Filter by lifecycle status")
    page: int = Field(1, ge=1)
    page_size: int = Field(20, ge=1, le=200)


# ---------------------------------------------------------------------------
# Paginated list response
# ---------------------------------------------------------------------------

class TenantListResponse(BaseModel):
    total: int
    page: int
    page_size: int
    total_pages: int
    items: list[TenantSummary]
