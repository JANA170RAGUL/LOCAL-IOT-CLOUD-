# Tenant Module

> **Version:** 1.0  
> **Status:** ✅ Complete  
> **Last updated:** 2026-07-11

---

## Purpose

The Tenant module is the core partition layer of the platform's multi-tenant architecture. 

Within LocalIoTCloud, an **Organization** can host multiple isolated **Tenants**. Each Tenant acts as a sandboxed environment containing:
- Users
- Projects
- Gateways
- Devices
- Sensors
- Dashboards
- Rules
- Widgets
- Settings

Cross-tenant data access is strictly forbidden. The Tenant module manages the registration, lifecycle status, details updates, and soft-deactivations of these sandboxed divisions.

---

## Architecture

```
API Router  (tenant_router.py)
    │
    ▼
TenantService  (tenant_service.py)
    │
    ├── Validation (uniqueness within Organization, email global check)
    ├── Business Rules (soft-delete, parent status check)
    └── Audit Logging (structured logger.info)
    │
    ▼
TenantRepository  (tenant_repository.py)
    │
    ▼
MySQL  —  tenants table (linked to organizations table)
```

**Layer responsibilities:**

| Layer | File | Responsibility | Naming Convention |
|---|---|---|---|
| `models/` | `tenant.py` | SQLAlchemy ORM — database representation | Singular (`Tenant`) |
| `schemas/` | `tenant.py` | Pydantic — validation | `TenantCreate`, `TenantUpdate`, `TenantResponse` |
| `repositories/` | `tenant_repository.py` | SQL queries only (no business logic) | Database-oriented (`exists_by_code`, `list_by_organization`) |
| `services/` | `tenant_service.py` | Business rules, transactions, and validation | Business-oriented (`create_tenant`, `deactivate_tenant`) |
| `api/` | `tenant_router.py` | HTTP routing only | HTTP-oriented (`POST /organizations/{org_id}/tenants/`) |

---

## Database Schema

**Table:** `tenants`

Inherits `id`, `created_at`, `updated_at`, `is_active` from `BaseModel`.

### Identity & Hierarchy

| Column | Type | Constraints | Default | Notes |
|---|---|---|---|---|
| `id` | `CHAR(36)` | PK | `uuid4()` | UUID, auto-generated |
| `organization_id` | `CHAR(36)` | FK, NOT NULL, INDEX | — | References `organizations.id` ON DELETE RESTRICT |
| `code` | `VARCHAR(20)` | NOT NULL | — | Unique *within* Organization via composite key |
| `name` | `VARCHAR(150)` | NOT NULL, INDEX | — | Tenant name |
| `description` | `TEXT` | nullable | `NULL` | Tenant description |
| `logo_url` | `VARCHAR(500)` | nullable | `NULL` | Tenant logo URL |

### Contact

| Column | Type | Constraints | Default | Notes |
|---|---|---|---|---|
| `email` | `VARCHAR(150)` | NOT NULL | — | Global uniqueness constraint checked at service level |
| `phone` | `VARCHAR(20)` | nullable | `NULL` | Contact phone |
| `website` | `VARCHAR(255)` | nullable | `NULL` | Contact website |

### Location & Regional

| Column | Type | Constraints | Default |
|---|---|---|---|
| `address` | `TEXT` | nullable | `NULL` |
| `city` | `VARCHAR(100)` | nullable | `NULL` |
| `state` | `VARCHAR(100)` | nullable | `NULL` |
| `country` | `VARCHAR(100)` | nullable | `NULL` |
| `timezone` | `VARCHAR(100)` | NOT NULL | `Asia/Kolkata` |

### Status

| Column | Type | Default | Valid values |
|---|---|---|---|
| `status` | `VARCHAR(20)` | `ACTIVE` | `ACTIVE`, `INACTIVE`, `SUSPENDED`, `TRIAL`, `EXPIRED` |

### Composite Constraints & Indexes

- **Composite Unique Key:** `uq_tenant_org_code` (`organization_id`, `code`)
- **Indexes:**
  - `ix_tenants_name` on `name`
  - `ix_tenants_organization_id` on `organization_id`
  - `ix_tenants_status` on `status`

---

## API Endpoints

### `POST /organizations/{organization_id}/tenants/`

Register a new tenant under a parent organization.

**Request body** (`TenantCreate`):

```json
{
    "code": "LAB01",
    "name": "Idea Lab 01",
    "email": "lab01@example.com",
    "description": "AICTE IDEA Lab for IoT prototypes",
    "logo_url": "https://cdn.example.com/logo.png",
    "phone": "+91-44-12345678",
    "website": "https://lab.example.com",
    "address": "Block 2, Campus Ground",
    "city": "Chennai",
    "state": "Tamil Nadu",
    "country": "India",
    "timezone": "Asia/Kolkata",
    "status": "ACTIVE"
}
```

**Response:** `201 Created` → full `TenantResponse`

**Errors:**

| HTTP | Condition | Message |
|---|---|---|
| `409` | Tenant code already taken in this organization | `A tenant with this code already exists in this organization.` |
| `409` | Email already registered to any other tenant | `A tenant with this e-mail already exists.` |

---

### `GET /organizations/{organization_id}/tenants/`

List all tenants belonging to a specific organization.

**Query parameters:**

| Parameter | Type | Default | Description |
|---|---|---|---|
| `search` | `string` | — | Keyword search across name, code, email (case-insensitive LIKE) |
| `status` | `string` | — | Lifecycle status: `ACTIVE`, `INACTIVE`, `SUSPENDED`, `TRIAL`, `EXPIRED` |
| `page` | `int` | `1` | Page number (1-indexed) |
| `page_size` | `int` | `20` | Items per page (max `200`) |

**Response:** `200 OK` → `TenantListResponse`

---

### `GET /tenants/{tenant_id}`

Fetch a single tenant by UUID.

**Response:** `200 OK` → `TenantResponse`

**Errors:**

| HTTP | Condition |
|---|---|
| `404` | ID not found → `TenantNotFound` |

---

### `PATCH /tenants/{tenant_id}` (or `PUT /tenants/{tenant_id}`)

Partially update a tenant. Only provided fields are modified.

**Updatable fields:** `name`, `description`, `logo_url`, `email`, `phone`, `website`, `address`, `city`, `state`, `country`, `timezone`, `status`.

**Errors:**

| HTTP | Condition |
|---|---|
| `404` | Tenant ID not found |
| `409` | Updated email conflict with another tenant |

---

### `DELETE /tenants/{tenant_id}`

Soft-delete a tenant. Sets `is_active = False` and `status = "INACTIVE"`.

**Response:** `200 OK`
```json
{
    "message": "Tenant deactivated successfully."
}
```

---

## Business Rules

1. **Hierarchy Integrity:** Every Tenant must belong to a valid Organization. Cascading delete-orphans is registered on the SQLAlchemy relationship, but `ondelete="RESTRICT"` prevents deletion of an organization if active tenants exist in the database without direct cascade handling.
2. **Tenant Code Scoping:** The tenant code is unique only inside its parent Organization. Multiple organizations can host a tenant with code `LAB01`, but a single organization cannot have two tenants with code `LAB01`.
3. **Soft Delete Policy:** A tenant is never physically deleted. `DELETE` updates `is_active` to `False` and `status` to `INACTIVE`.
4. **Structured Audit Events:** Changes (creations, updates, soft-deletes) emit structured log events for audit-tracking systems.

---

## Error Reference

| Exception | HTTP | Message |
|---|---|---|
| `TenantNotFound` | `404` | Tenant not found. |
| `TenantCodeTaken` | `409` | A tenant with this code already exists in this organization. |
| `TenantEmailTaken` | `409` | A tenant with this e-mail already exists. |
| `TenantInactive` | `403` | Tenant is inactive. |

---

## Relationships

```
Organization  (organizations table)
    │
    └── 1:N  (cascade="all, delete-orphan", ondelete="RESTRICT")
        │
        ▼
     Tenant   (tenants table)
```

---

## File Map

```
backend/app/
└── modules/tenants/
    ├── __init__.py
    ├── constants.py
    ├── dependencies.py                 Dependency provider get_tenant_service()
    ├── api/
    │   ├── __init__.py
    │   └── tenant_router.py            FastAPI routers (POST/GET/PATCH/DELETE)
    ├── models/
    │   ├── __init__.py
    │   └── tenant.py                   SQLAlchemy Model
    ├── repositories/
    │   ├── __init__.py
    │   └── tenant_repository.py        Database queries following exists_by_* & list_by_* conventions
    ├── schemas/
    │   ├── __init__.py
    │   └── tenant.py                   Pydantic validations
    └── services/
        ├── __init__.py
        └── tenant_service.py           Business logic layer using naming convention
```

---

## Test Coverage

- **File:** [`tests/test_tenant.py`](../backend/tests/test_tenant.py)
- **Runner:** `pytest`
- **Result:** 12/12 passed (SQLite in-memory)

| Test Suite | Tests Covered |
|---|---|
| `TestCreateTenant` | success, duplicate code same org (raises), duplicate code diff org (allowed), duplicate email (raises) |
| `TestGetTenant` | tenant found, tenant not found, get by code |
| `TestUpdateTenant` | update name, update email conflict, same email allowed |
| `TestDeleteTenant` | deactivate soft-delete validation |
| `TestListTenants` | filter by organization scoping |
