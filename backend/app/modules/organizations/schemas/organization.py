from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict, EmailStr, Field


# ---------------------------------------------------------------------------
# Status & license literals (mirrors model constants)
# ---------------------------------------------------------------------------

VALID_STATUSES = {"ACTIVE", "INACTIVE", "SUSPENDED", "TRIAL", "EXPIRED"}
VALID_LICENSE_TYPES = {"Community", "Professional", "Enterprise", "Academic"}


# ---------------------------------------------------------------------------
# Base Schema  —  shared by Create and Response
# ---------------------------------------------------------------------------

class OrganizationBase(BaseModel):
    # Identity
    code: str = Field(..., min_length=2, max_length=20)
    name: str = Field(..., min_length=3, max_length=150)
    description: Optional[str] = Field(None, max_length=500)
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
    timezone: str = "Asia/Kolkata"
    language: str = "en"
    currency: str = "INR"


# ---------------------------------------------------------------------------
# Create Organization
# ---------------------------------------------------------------------------

class OrganizationCreate(OrganizationBase):
    """
    Payload for creating a new organization.

    license_type and status are declared here (not in OrganizationBase) because
    they are write-once on creation and have sensible defaults.  Declaring them
    ensures model_dump() always includes them so the ORM never falls back to its
    column-level default.
    """
    status: str = Field(
        "ACTIVE",
        pattern="^(ACTIVE|INACTIVE|SUSPENDED|TRIAL|EXPIRED)$",
        description="Initial lifecycle status",
    )
    license_type: str = Field(
        "Community",
        pattern="^(Community|Professional|Enterprise|Academic)$",
        description="License tier",
    )
    subscription_end: Optional[datetime] = None


# ---------------------------------------------------------------------------
# Update Organization  —  every field optional (PATCH semantics)
# ---------------------------------------------------------------------------

class OrganizationUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=3, max_length=150)
    description: Optional[str] = Field(None, max_length=500)
    logo_url: Optional[str] = Field(None, max_length=500)

    email: Optional[EmailStr] = None
    phone: Optional[str] = Field(None, max_length=20)
    website: Optional[str] = Field(None, max_length=255)

    address: Optional[str] = None
    city: Optional[str] = Field(None, max_length=100)
    state: Optional[str] = Field(None, max_length=100)
    country: Optional[str] = Field(None, max_length=100)

    timezone: Optional[str] = None
    language: Optional[str] = None
    currency: Optional[str] = None

    # Business state  —  str, not bool
    status: Optional[str] = Field(None, pattern="^(ACTIVE|INACTIVE|SUSPENDED|TRIAL|EXPIRED)$")
    license_type: Optional[str] = Field(None, pattern="^(Community|Professional|Enterprise|Academic)$")
    subscription_end: Optional[datetime] = None


# ---------------------------------------------------------------------------
# Full Response
# ---------------------------------------------------------------------------

class OrganizationResponse(OrganizationBase):
    model_config = ConfigDict(from_attributes=True)

    id: str

    # Business state
    status: str
    license_type: str
    subscription_end: Optional[datetime] = None

    # Audit
    created_at: datetime
    updated_at: datetime
    is_active: bool


# ---------------------------------------------------------------------------
# Summary  —  lightweight item used inside list responses
# ---------------------------------------------------------------------------

class OrganizationSummary(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    code: str
    name: str
    email: EmailStr
    status: str
    license_type: str
    is_active: bool


# ---------------------------------------------------------------------------
# List / filter query params
# ---------------------------------------------------------------------------

class OrganizationFilter(BaseModel):
    """Query parameters accepted by GET /organizations/."""
    search: Optional[str] = Field(None, description="Keyword search across name, code, email")
    status: Optional[str] = Field(
        None,
        pattern="^(ACTIVE|INACTIVE|SUSPENDED|TRIAL|EXPIRED)$",
        description="Filter by lifecycle status",
    )
    page: int = Field(1, ge=1)
    page_size: int = Field(20, ge=1, le=100)


# ---------------------------------------------------------------------------
# Paginated list response
# ---------------------------------------------------------------------------

class OrganizationListResponse(BaseModel):
    total: int
    page: int
    page_size: int
    total_pages: int
    items: list[OrganizationSummary]