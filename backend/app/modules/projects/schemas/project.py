"""
app/modules/projects/schemas/project.py

Pydantic schemas for the Project module.

Schema hierarchy
----------------
ProjectBase          — shared fields (Create + Response)
ProjectCreate        — input for POST /tenants/{tenant_id}/projects/
ProjectUpdate        — input for PATCH /projects/{project_id} (all optional)
ProjectResponse      — full record returned to the caller
ProjectSummary       — lightweight item inside list responses
ProjectFilter        — query params for GET /tenants/{tenant_id}/projects/
ProjectListResponse  — paginated list envelope
"""

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field

# ---------------------------------------------------------------------------
# Valid status values (mirrors the model column)
# ---------------------------------------------------------------------------

VALID_STATUSES = {"ACTIVE", "INACTIVE", "SUSPENDED", "TRIAL", "EXPIRED"}
STATUS_PATTERN = "^(ACTIVE|INACTIVE|SUSPENDED|TRIAL|EXPIRED)$"


# ---------------------------------------------------------------------------
# Base — shared fields
# ---------------------------------------------------------------------------

class ProjectBase(BaseModel):
    code: str = Field(..., min_length=2, max_length=20, description="Short unique code within the tenant")
    name: str = Field(..., min_length=3, max_length=150)
    description: Optional[str] = Field(None, description="Optional summary of the project")


# ---------------------------------------------------------------------------
# Create — POST /tenants/{tenant_id}/projects/
# ---------------------------------------------------------------------------

class ProjectCreate(ProjectBase):
    """
    Payload for creating a new project.

    tenant_id is supplied by the URL path parameter, not the body.
    status is declared here (not ProjectBase) so model_dump() always
    includes it — prevents the ORM from falling back to the column default.
    """
    status: str = Field(
        "ACTIVE",
        pattern=STATUS_PATTERN,
        description="Initial lifecycle status",
    )


# ---------------------------------------------------------------------------
# Update — PATCH /projects/{project_id}  (all fields optional)
# ---------------------------------------------------------------------------

class ProjectUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=3, max_length=150)
    description: Optional[str] = None
    status: Optional[str] = Field(None, pattern=STATUS_PATTERN)


# ---------------------------------------------------------------------------
# Response — full record
# ---------------------------------------------------------------------------

class ProjectResponse(ProjectBase):
    model_config = ConfigDict(from_attributes=True)

    id: str
    tenant_id: str
    status: str

    # Audit
    created_at: datetime
    updated_at: datetime
    is_active: bool


# ---------------------------------------------------------------------------
# Summary — lightweight item in list responses
# ---------------------------------------------------------------------------

class ProjectSummary(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    tenant_id: str
    code: str
    name: str
    status: str
    is_active: bool


# ---------------------------------------------------------------------------
# Filter — query parameters for GET /tenants/{tenant_id}/projects/
# ---------------------------------------------------------------------------

class ProjectFilter(BaseModel):
    """Query parameters accepted by the list_projects endpoint."""
    search: Optional[str] = Field(None, description="Keyword search on name, code")
    status: Optional[str] = Field(None, pattern=STATUS_PATTERN, description="Filter by status")
    page: int = Field(1, ge=1)
    page_size: int = Field(20, ge=1, le=200)


# ---------------------------------------------------------------------------
# Paginated list response
# ---------------------------------------------------------------------------

class ProjectListResponse(BaseModel):
    total: int
    page: int
    page_size: int
    total_pages: int
    items: list[ProjectSummary]
