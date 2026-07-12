# Dashboard Module

> **Version:** 1.0  
> **Status:** ✅ Complete  
> **Last updated:** 2026-07-12

---

## Purpose

The Dashboard module provides grid layouts to host visualization components (Widgets) displaying telemetry data from InfluxDB. 

Every dashboard belongs to a **Project**. It defines:
- A grid configuration and positions (`layout`)
- Visual look and feel customizations (`theme`)
- Fetch configuration parameters (`refresh_interval`, `is_public`)

---

## Architecture

```
API Router  (dashboard_router.py)
    │
    ▼
DashboardService  (dashboard_service.py)
    │
    ├── Validation (uniqueness within Project, parent active check)
    ├── Business Rules (soft-delete, widget deactivation cascade)
    └── Audit Logging
    │
    ▼
DashboardRepository  (dashboard_repository.py)
    │
    ▼
MySQL  —  dashboards table (linked to projects table)
```

**Layer responsibilities:**

| Layer | File | Responsibility | Naming Convention |
|---|---|---|---|
| `models/` | `dashboard.py` | SQLAlchemy ORM — database representation | Singular (`Dashboard`) |
| `schemas/` | `dashboard.py` | Pydantic — validation | `DashboardCreate`, `DashboardUpdate`, `DashboardResponse` |
| `repositories/` | `dashboard_repository.py` | SQL queries only (no business logic) | Database-oriented (`exists_by_code`, `list_by_project`) |
| `services/` | `dashboard_service.py` | Business rules, transactions, and validation | Business-oriented (`create_dashboard`, `deactivate_dashboard`) |
| `api/` | `dashboard_router.py` | HTTP routing only | HTTP-oriented (`POST /projects/{project_id}/dashboards`) |

---

## Database Schema

**Table:** `dashboards`

Inherits `id`, `created_at`, `updated_at`, `is_active` from `BaseModel`.

### Identity & Hierarchy

| Column | Type | Constraints | Default | Notes |
|---|---|---|---|---|
| `id` | `CHAR(36)` | PK | `uuid4()` | UUID, auto-generated |
| `project_id` | `CHAR(36)` | FK, NOT NULL, INDEX | — | References `projects.id` ON DELETE RESTRICT |
| `code` | `VARCHAR(50)` | NOT NULL | — | Unique *within* Project via composite key |
| `name` | `VARCHAR(100)` | NOT NULL, INDEX | — | Dashboard display name |
| `description` | `TEXT` | nullable | `NULL` | Detailed description |

### Styling & Config

| Column | Type | Default | Notes |
|---|---|---|---|
| `layout` | `JSON` | `NULL` | Grid configuration map |
| `theme` | `VARCHAR(50)` | `NULL` | Visual theme (e.g. `dark`, `light`) |
| `is_public` | `BOOLEAN` | `FALSE` | Access availability scope |
| `refresh_interval` | `INTEGER` | `NULL` | Dashboard refresh period in seconds |

### Status

| Column | Type | Default | Valid values |
|---|---|---|---|
| `status` | `VARCHAR(20)` | `ACTIVE` | `ACTIVE`, `INACTIVE` |

### Composite Constraints & Indexes

- **Composite Unique Key:** `uq_dashboard_project_code` (`project_id`, `code`)
- **Indexes:**
  - `ix_dashboards_name` on `name`
  - `ix_dashboards_project_id` on `project_id`
  - `ix_dashboards_status` on `status`
  - `ix_dashboards_is_active` on `is_active`

---

## API Endpoints

### `POST /projects/{project_id}/dashboards`

Create a new dashboard inside a project.

**Request body** (`DashboardCreate`):
```json
{
    "code": "DASH01",
    "name": "Line 1 Monitoring",
    "description": "Sensors overview on Assembly Line 1",
    "layout": { "cols": 12, "rows": 8 },
    "theme": "dark",
    "is_public": false,
    "refresh_interval": 10
}
```

**Response:** `201 Created` → full `DashboardResponse`

---

### `GET /projects/{project_id}/dashboards`

List dashboards belonging to a project. Supports search and pagination.

**Query parameters:**
- `status` (string, optional): Filter by status
- `search` (string, optional): Search term matching name/code
- `page` (int, default `1`)
- `page_size` (int, default `20`)

**Response:** `200 OK` → `DashboardListResponse`

---

### `GET /dashboards/{dashboard_id}`

Fetch a single dashboard details.

---

### `PATCH /dashboards/{dashboard_id}`

Partially update dashboard attributes (e.g. `layout`, `theme`, `refresh_interval`, `status`).

---

### `DELETE /dashboards/{dashboard_id}`

Soft-deactivates the dashboard. Sets `is_active = False` and `status = "INACTIVE"`, cascading deactivation to all its widgets.

---

## Business Rules

1. **Scoping and Integrity:** A dashboard cannot be created without a parent project. Deleting a project is restricted at database-level if there are active references, but a soft-deactivated dashboard keeps its underlying data intact.
2. **Dashboard Code Scoping:** Code is unique inside a Project container. Two different projects can have a dashboard with code `OVERVIEW`, but a single project cannot have duplicate codes.
3. **Soft Delete Policy:** `DELETE /dashboards/{dashboard_id}` cascades down to all active widgets on the dashboard. Both the dashboard and its widgets have their `status` updated to `INACTIVE` and `is_active` set to `False`.

---

## Error Reference

| Exception | HTTP | Message |
|---|---|---|
| `DashboardNotFound` | `404` | Dashboard not found. |
| `DashboardCodeConflict` | `409` | Dashboard code already exists in this project. |
| `ProjectNotFound` | `404` | Project not found. |

---

## Relationships

```
    Project   (projects table)
      │
      └── 1:N  (cascade="all, delete-orphan", ondelete="RESTRICT")
          │
          ▼
    Dashboard (dashboards table)
          │
          └── 1:N  (cascade="all, delete-orphan", ondelete="CASCADE")
              │
              ▼
    Widget    (widgets table)
```

---

## File Map

```
backend/app/modules/dashboards/
├── __init__.py
├── constants.py
├── dependencies.py                 Dependency provider get_dashboard_service()
├── api/
│   ├── __init__.py
│   └── dashboard_router.py         FastAPI routers
├── models/
│   ├── __init__.py
│   └── dashboard.py                SQLAlchemy Model
├── repositories/
│   ├── __init__.py
│   └── dashboard_repository.py     Database queries layer
├── schemas/
│   ├── __init__.py
│   └── dashboard.py                Pydantic validation models
└── services/
    ├── __init__.py
    └── dashboard_service.py        Business logic and validation
```

---

## Test Coverage

- **File:** [`tests/test_dashboard.py`](../backend/tests/test_dashboard.py)
- **Runner:** `pytest`
- **Result:** 9/9 passed

| Test Suite | Tests Covered |
|---|---|
| `TestCreateDashboard` | success, project not found check, duplicate code checks within/across projects |
| `TestGetDashboard` | dashboard found, not found check |
| `TestUpdateDashboard` | update layout and name attributes |
| `TestDeactivateDashboard`| soft-deactivate dashboard, verify cascade deactivation to widgets |
| `TestListDashboards` | list by parent project scoping |

---

## Changelog

- **v1.0 (2026-07-12):** Initial implementation, including service-level test suites and API routers.
