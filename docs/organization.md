# Organization Module

> **Version:** 1.0  
> **Status:** ✅ Complete  
> **Last updated:** 2026-07-11

---

## Purpose

The Organization module is the **top-level commercial entity** in LocalIoTCloud.

Every other resource on the platform (tenants, devices, users, gateways) belongs
to an organization. The module handles:

- Registration of new customer organizations
- Commercial lifecycle management (status, license tier, subscription expiry)
- Soft-deletion that preserves all historical data and foreign-key integrity
- Searchable, paginated listing for the admin dashboard

It is the **reference implementation** for all future modules. Every other
module follows the same layered architecture.

---

## Architecture

```
API Router  (organization_router.py)
    │
    ▼
OrganizationService  (organization_service.py)
    │
    ├── Validation (uniqueness, existence)
    ├── Business Rules (lifecycle, soft-delete)
    └── Audit Logging (structured logger.info)
    │
    ▼
OrganizationRepository  (organization_repository.py)
    │
    ▼
MySQL  —  organizations table
```

**Layer responsibilities:**

| Layer | File | Responsibility |
|---|---|---|
| `models/` | `organization.py` | SQLAlchemy ORM — database only |
| `schemas/` | `organization.py` | Pydantic — validation only |
| `repositories/` | `organization_repository.py` | SQL queries only |
| `services/` | `organization_service.py` | Business rules only |
| `api/` | `organization_router.py` | HTTP routing only |

---

## Database Schema

**Table:** `organizations`

Inherits `id`, `created_at`, `updated_at`, `is_active` from `BaseModel`.

### Identity

| Column | Type | Constraints | Default | Notes |
|---|---|---|---|---|
| `id` | `CHAR(36)` | PK | `uuid4()` | UUID, auto-generated |
| `code` | `VARCHAR(20)` | UNIQUE, NOT NULL, INDEX | — | Short identifier e.g. `VELTECH` |
| `name` | `VARCHAR(150)` | NOT NULL, INDEX | — | Display name |
| `description` | `VARCHAR(500)` | nullable | `NULL` | Optional summary |
| `logo_url` | `VARCHAR(500)` | nullable | `NULL` | URL to organization logo |

### Contact

| Column | Type | Constraints | Default |
|---|---|---|---|
| `email` | `VARCHAR(150)` | UNIQUE, NOT NULL | — |
| `phone` | `VARCHAR(20)` | nullable | `NULL` |
| `website` | `VARCHAR(255)` | nullable | `NULL` |

### Location

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `address` | `TEXT` | nullable | Unbounded — handles long international addresses |
| `city` | `VARCHAR(100)` | nullable | — |
| `state` | `VARCHAR(100)` | nullable | — |
| `country` | `VARCHAR(100)` | nullable | — |

### Locale

| Column | Type | Default |
|---|---|---|
| `timezone` | `VARCHAR(100)` | `Asia/Kolkata` |
| `language` | `VARCHAR(50)` | `en` |
| `currency` | `VARCHAR(10)` | `INR` |

### Status & Licensing

| Column | Type | Default | Valid values |
|---|---|---|---|
| `status` | `VARCHAR(20)` | `ACTIVE` | `ACTIVE` `INACTIVE` `SUSPENDED` `TRIAL` `EXPIRED` |
| `license_type` | `VARCHAR(50)` | `Community` | `Community` `Professional` `Enterprise` `Academic` |
| `subscription_end` | `DATETIME` | `NULL` | `NULL` = no expiry |

### Audit (from BaseModel)

| Column | Type | Notes |
|---|---|---|
| `created_at` | `DATETIME` | Server-side `NOW()` on insert |
| `updated_at` | `DATETIME` | Server-side `NOW()` on update |
| `is_active` | `BOOLEAN` | Soft-delete flag. `False` = deactivated |

> **`status` vs `is_active`** — these serve different purposes and must not be conflated.
>
> | Flag | Meaning |
> |---|---|
> | `is_active = False` | Record is soft-deleted. Exclude from all queries by default. |
> | `status = "INACTIVE"` | Business lifecycle state. Record may still be queryable for history. |
>
> A DELETE request sets **both** to their inactive values simultaneously.

---

## API Endpoints

**Base path:** `/organizations`  
**Auth:** Open (authentication module wired in Step 7)  
**Interactive docs:** `http://localhost:8000/docs#/Organizations`

---

### `POST /organizations/`

Register a new organization.

**Request body** (`OrganizationCreate`):

```json
{
    "code": "VELTECH",
    "name": "Vel Tech University",
    "email": "admin@veltech.edu.in",
    "description": "Leading engineering university",
    "logo_url": "https://cdn.example.com/veltech.png",
    "phone": "+91-44-26000000",
    "website": "https://veltech.edu.in",
    "address": "Avadi-Vel Tech Road, Chennai",
    "city": "Chennai",
    "state": "Tamil Nadu",
    "country": "India",
    "timezone": "Asia/Kolkata",
    "language": "en",
    "currency": "INR",
    "status": "ACTIVE",
    "license_type": "Academic",
    "subscription_end": null
}
```

**Response:** `201 Created` → full `OrganizationResponse`

**Errors:**

| HTTP | Condition |
|---|---|
| `409` | `code` already registered → `OrganizationCodeTaken` |
| `409` | `email` already registered → `OrganizationEmailTaken` |
| `422` | Validation error (invalid field values) |

---

### `GET /organizations/`

Return a paginated list of organizations.

**Query parameters:**

| Parameter | Type | Default | Description |
|---|---|---|---|
| `search` | `string` | — | Keyword match on `name`, `code`, `email` (case-insensitive LIKE) |
| `status` | `string` | — | Exact filter: `ACTIVE` `INACTIVE` `SUSPENDED` `TRIAL` `EXPIRED` |
| `page` | `int` | `1` | Page number (1-indexed) |
| `page_size` | `int` | `20` | Items per page (max `200`) |

**Example:**
```
GET /organizations/?search=vel&status=ACTIVE&page=1&page_size=20
```

**Response:** `200 OK`

```json
{
    "total": 42,
    "page": 1,
    "page_size": 20,
    "total_pages": 3,
    "items": [
        {
            "id": "...",
            "code": "VELTECH",
            "name": "Vel Tech University",
            "email": "admin@veltech.edu.in",
            "status": "ACTIVE",
            "license_type": "Academic",
            "is_active": true
        }
    ]
}
```

---

### `GET /organizations/{org_id}`

Fetch a single organization by UUID.

**Response:** `200 OK` → full `OrganizationResponse`

**Errors:**

| HTTP | Condition |
|---|---|
| `404` | ID not found → `OrganizationNotFound` |

---

### `PUT /organizations/{org_id}`

Partially update an organization. Only fields included in the request body are changed
(`exclude_unset` semantics — omitted fields are never touched).

**Updatable fields:** `name`, `description`, `logo_url`, `email`, `phone`, `website`,
`address`, `city`, `state`, `country`, `timezone`, `language`, `currency`,
`status`, `license_type`, `subscription_end`

> `code` is **not** updatable after creation.

**Errors:**

| HTTP | Condition |
|---|---|
| `404` | ID not found |
| `409` | New email already belongs to another org |

---

### `DELETE /organizations/{org_id}`

Soft-delete an organization. **No data is physically removed.**

Sets `is_active = False` and `status = "INACTIVE"`.

**Response:** `200 OK`
```json
{
    "message": "Organization deactivated successfully."
}
```

**Errors:**

| HTTP | Condition |
|---|---|
| `404` | ID not found |

---

## Business Rules

1. **Code is immutable.** Once set at creation it cannot be changed. It acts as a
   stable external identifier (used in URLs, integrations, and audit logs).

2. **Email must be globally unique.** No two organizations may share the same contact
   email. This is enforced at both the database level (UNIQUE constraint) and the
   service level (existence check before write).

3. **No physical deletes.** The `DELETE` endpoint deactivates — it never issues a SQL
   `DELETE`. This preserves audit trails and FK integrity for all child entities
   (tenants, devices, etc.) that reference the organization.

4. **`status` and `is_active` are distinct.** See the schema table above. Both are set
   simultaneously on deactivation but serve different semantic purposes.

5. **`subscription_end = NULL` means no expiry.** Typically used for `Community` tier.
   License expiry enforcement is a future concern for the Licensing module.

6. **Update is partial (PATCH semantics via PUT).** The service uses
   `model_dump(exclude_unset=True)` so a caller that only sends `{"name": "New Name"}`
   will never accidentally clear other fields.

7. **Audit events are emitted on every mutation.** `create`, `update`, and `delete`
   each emit a structured `logger.info()` line with the `org_id` and relevant context.
   These are placeholder hooks for a future audit-log table.

---

## Error Reference

All errors follow the global `AppException` shape:

```json
{
    "detail": "An organization with this code already exists."
}
```

| Exception | HTTP | Message |
|---|---|---|
| `OrganizationCodeTaken` | `409` | An organization with this code already exists. |
| `OrganizationEmailTaken` | `409` | An organization with this e-mail already exists. |
| `OrganizationNotFound` | `404` | Organization not found. |
| `OrganizationInactive` | `403` | Organization is inactive. |
| `OrganizationAlreadyExists` | `409` | Organization already exists. *(legacy, kept for BC)* |

---

## Relationships

The Organization is the **root entity** of the platform hierarchy.

```
Organization  (this module)
    │
    ├── Tenant  (1:many)  — one org hosts many tenants
    │       │
    │       ├── User  (1:many)
    │       ├── Device  (1:many)
    │       ├── Gateway  (1:many)
    │       └── Project  (1:many)
    │
    └── Licensing  (1:1)  — one active license per org
```

> No foreign keys back to this table exist yet — they will be added as each
> child module is built with its own Alembic migration.

---

## File Map

```
backend/app/
├── modules/organizations/
│   ├── __init__.py
│   ├── constants.py                    Field limits, error messages
│   ├── dependencies.py                 FastAPI Depends() helpers
│   ├── api/
│   │   ├── __init__.py                 (reference copy of router)
│   │   └── organization_router.py      ← registered in main.py
│   ├── models/
│   │   ├── __init__.py
│   │   └── organization.py             SQLAlchemy ORM model
│   ├── repositories/
│   │   ├── __init__.py
│   │   └── organization_repository.py  All SQL queries
│   ├── schemas/
│   │   ├── __init__.py
│   │   └── organization.py             Pydantic schemas
│   └── services/
│       ├── __init__.py
│       └── organization_service.py     Business logic
│
├── shared/exceptions/
│   └── organization.py                 Domain exceptions
│
└── tests/
    └── test_organization.py            17 unit tests (SQLite in-memory)
```

---

## Test Coverage

**Test file:** [`tests/test_organization.py`](../backend/tests/test_organization.py)  
**Runner:** `pytest`  
**Database:** In-memory SQLite (no MySQL required)  
**Result:** 17/17 passed

| Test class | Tests |
|---|---|
| `TestCreateOrganization` | success, duplicate code → 409, duplicate email → 409, license_type regression |
| `TestGetOrganization` | found, not found → 404 |
| `TestUpdateOrganization` | name, license_type, status, email conflict → 409, same email allowed |
| `TestDeleteOrganization` | soft-delete verified, ghost ID → 404 |
| `TestListOrganizations` | all orgs, status filter, keyword search, pagination |

Run with:
```bash
cd backend
.venv\Scripts\python.exe -m pytest tests/test_organization.py -v
```

---

## Changelog

| Version | Date | Notes |
|---|---|---|
| v1.0 | 2026-07-11 | Initial release. Full CRUD, soft-delete, search/filter, 17 tests. |
| — | 2026-07-11 | Model v2: `status` changed from `bool` → `str`; added `description`, `logo_url`, `license_type`, `subscription_end`, `Text` address. |
