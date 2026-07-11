# Project Module

> **Version:** 1.0  
> **Status:** ✅ Complete  
> **Last updated:** 2026-07-11

---

## Purpose

The Project module is the top-level container for all IoT resources within a single Tenant.

Every project belongs to a **Tenant**. A Project acts as an administrative and logical grouping for:
- Gateways
- Devices
- Sensors
- Dashboards
- Widgets
- Alerts
- Telemetry data

Projects allow tenants to cleanly separate different applications, departments, or deployments (e.g. *Smart Agriculture*, *Energy Monitoring*, *Weather Station*) without crossing boundaries.

---

## Architecture

```
API Router  (project_router.py)
    │
    ▼
ProjectService  (project_service.py)
    │
    ├── Validation (uniqueness within Tenant)
    ├── Business Rules (soft-delete, scoping)
    └── Audit Logging (structured logger.info)
    │
    ▼
ProjectRepository  (project_repository.py)
    │
    ▼
MySQL  —  projects table (linked to tenants table)
```

**Layer responsibilities:**

| Layer | File | Responsibility | Naming Convention |
|---|---|---|---|
| `models/` | `project.py` | SQLAlchemy ORM — database representation | Singular (`Project`) |
| `schemas/` | `project.py` | Pydantic — validation | `ProjectCreate`, `ProjectUpdate`, `ProjectResponse` |
| `repositories/` | `project_repository.py` | SQL queries only (no business logic) | Database-oriented (`exists_by_code`, `list_by_tenant`) |
| `services/` | `project_service.py` | Business rules, transactions, and validation | Business-oriented (`create_project`, `deactivate_project`) |
| `api/` | `project_router.py` | HTTP routing only | HTTP-oriented (`POST /tenants/{tenant_id}/projects/`) |

---

## Database Schema

**Table:** `projects`

Inherits `id`, `created_at`, `updated_at`, `is_active` from `BaseModel`.

### Identity & Hierarchy

| Column | Type | Constraints | Default | Notes |
|---|---|---|---|---|
| `id` | `CHAR(36)` | PK | `uuid4()` | UUID, auto-generated |
| `tenant_id` | `CHAR(36)` | FK, NOT NULL, INDEX | — | References `tenants.id` ON DELETE RESTRICT |
| `code` | `VARCHAR(20)` | NOT NULL | — | Unique *within* Tenant via composite key |
| `name` | `VARCHAR(150)` | NOT NULL, INDEX | — | Project display name |
| `description` | `TEXT` | nullable | `NULL` | Project description |

### Status

| Column | Type | Default | Valid values |
|---|---|---|---|
| `status` | `VARCHAR(20)` | `ACTIVE` | `ACTIVE`, `INACTIVE`, `SUSPENDED`, `TRIAL`, `EXPIRED` |

### Composite Constraints & Indexes

- **Composite Unique Key:** `uq_project_tenant_code` (`tenant_id`, `code`)
- **Indexes:**
  - `ix_projects_name` on `name`
  - `ix_projects_tenant_id` on `tenant_id`
  - `ix_projects_status` on `status`

---

## API Endpoints

### `POST /tenants/{tenant_id}/projects/`

Create a new project under a specific tenant.

**Request body** (`ProjectCreate`):

```json
{
    "code": "PROJ01",
    "name": "Smart Classroom",
    "description": "IoT monitoring for classroom"
}
```

**Response:** `201 Created` → full `ProjectResponse`

**Errors:**

| HTTP | Condition | Message |
|---|---|---|
| `409` | Project code already taken in this tenant | `A project with this code already exists in this tenant.` |

---

### `GET /tenants/{tenant_id}/projects/`

List all projects belonging to a specific tenant.

**Query parameters:**

| Parameter | Type | Default | Description |
|---|---|---|---|
| `search` | `string` | — | Keyword search across name and code (case-insensitive LIKE) |
| `status` | `string` | — | Lifecycle status: `ACTIVE`, `INACTIVE`, `SUSPENDED`, `TRIAL`, `EXPIRED` |
| `page` | `int` | `1` | Page number (1-indexed) |
| `page_size` | `int` | `20` | Items per page (max `200`) |

**Response:** `200 OK` → `ProjectListResponse`

---

### `GET /projects/{project_id}`

Fetch a single project by UUID.

**Response:** `200 OK` → `ProjectResponse`

**Errors:**

| HTTP | Condition |
|---|---|
| `404` | ID not found → `ProjectNotFound` |

---

### `PATCH /projects/{project_id}` (or `PUT /projects/{project_id}`)

Partially update a project. Only provided fields are modified.

**Updatable fields:** `name`, `description`, `status`.

---

### `DELETE /projects/{project_id}`

Soft-delete a project. Sets `is_active = False` and `status = "INACTIVE"`.

**Response:** `200 OK`
```json
{
    "message": "Project deactivated successfully."
}
```

---

## Business Rules

1. **Hierarchy Integrity:** Every Project must belong to a valid Tenant. Deleting a tenant cascades to all projects, but database-level `ondelete="RESTRICT"` prevents deleting the parent if projects are referencing it outside of dynamic cascades.
2. **Project Code Scoping:** The project code is unique only inside its parent Tenant. Multiple tenants can host a project with code `PROJ01`, but a single tenant cannot have two projects with code `PROJ01`.
3. **Soft Delete Policy:** A project is never physically deleted. `DELETE` updates `is_active` to `False` and `status` to `INACTIVE`.
4. **Structured Audit Events:** Mutation actions emit structured log events for logging systems.

---

## Error Reference

| Exception | HTTP | Message |
|---|---|---|
| `ProjectNotFound` | `404` | Project not found. |
| `ProjectCodeTaken` | `409` | A project with this code already exists in this tenant. |
| `ProjectInactive` | `403` | Project is inactive. |

---

## Relationships

```
    Tenant    (tenants table)
      │
      └── 1:N  (cascade="all, delete-orphan", ondelete="RESTRICT")
          │
          ▼
    Project   (projects table)
```

---

## File Map

```
backend/app/
└── modules/projects/
    ├── __init__.py
    ├── constants.py
    ├── dependencies.py                 Dependency provider get_project_service()
    ├── api/
    │   ├── __init__.py
    │   └── project_router.py           FastAPI routers (POST/GET/PATCH/DELETE)
    ├── models/
    │   ├── __init__.py
    │   └── project.py                  SQLAlchemy Model
    ├── repositories/
    │   ├── __init__.py
    │   └── project_repository.py       Database queries following exists_by_* & list_by_* conventions
    ├── schemas/
    │   ├── __init__.py
    │   └── project.py                  Pydantic validations
    └── services/
        ├── __init__.py
        └── project_service.py          Business logic layer using naming convention
```

---

## Test Coverage

- **File:** [`tests/test_project.py`](../backend/tests/test_project.py)
- **Runner:** `pytest`
- **Result:** 9/9 passed (SQLite in-memory)

| Test Suite | Tests Covered |
|---|---|
| `TestCreateProject` | success, duplicate code same tenant (raises), duplicate code diff tenant (allowed) |
| `TestGetProject` | project found, project not found, get by code |
| `TestUpdateProject` | update name |
| `TestDeleteProject` | deactivate soft-delete validation |
| `TestListProjects` | filter by tenant scoping |
