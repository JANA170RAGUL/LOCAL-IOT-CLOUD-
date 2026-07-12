# Widget Module

> **Version:** 1.0  
> **Status:** ✅ Complete  
> **Last updated:** 2026-07-12

---

## Purpose

The Widget module represents the core visualization panels displayed inside a Dashboard. Each widget configuration stores query parameters to extract live or historical telemetry data from InfluxDB, along with layout and layout scaling configurations (height, width, position) to render correctly in a Grafana-style grid interface.

---

## Architecture

```
API Router  (widget_router.py)
    │
    ▼
WidgetService  (widget_service.py)
    │
    ├── Validation (uniqueness within Dashboard, active parent check)
    ├── Business Rules (soft-delete, positioning limits)
    └── Audit Logging
    │
    ▼
WidgetRepository  (widget_repository.py)
    │
    ▼
MySQL  —  widgets table (linked to dashboards table)
```

**Layer responsibilities:**

| Layer | File | Responsibility | Naming Convention |
|---|---|---|---|
| `shared/widgets/` | `widget_types.py` | Enums representing visualization display types | `WidgetType` |
| `models/` | `widget.py` | SQLAlchemy ORM — database representation | Singular (`Widget`) |
| `schemas/` | `widget.py` | Pydantic — validation | `WidgetCreate`, `WidgetUpdate`, `WidgetResponse` |
| `repositories/` | `widget_repository.py` | SQL queries only (no business logic) | Database-oriented (`exists_by_code`, `list_by_dashboard`) |
| `services/` | `widget_service.py` | Business rules, transactions, and validation | Business-oriented (`create_widget`, `deactivate_widget`) |
| `api/` | `widget_router.py` | HTTP routing only | HTTP-oriented (`POST /dashboards/{dashboard_id}/widgets`) |

---

## Database Schema

**Table:** `widgets`

Inherits `id`, `created_at`, `updated_at`, `is_active` from `BaseModel`.

### Identity & Hierarchy

| Column | Type | Constraints | Default | Notes |
|---|---|---|---|---|
| `id` | `CHAR(36)` | PK | `uuid4()` | UUID, auto-generated |
| `dashboard_id` | `CHAR(36)` | FK, NOT NULL, INDEX | — | References `dashboards.id` ON DELETE CASCADE |
| `code` | `VARCHAR(50)` | NOT NULL | — | Unique *within* Dashboard via composite key |
| `name` | `VARCHAR(100)` | NOT NULL, INDEX | — | Widget display name |
| `title` | `VARCHAR(100)` | nullable | `NULL` | Rendered panel header title |
| `description` | `TEXT` | nullable | `NULL` | Detailed description |

### Visual & Data Configurations

| Column | Type | Default | Notes |
|---|---|---|---|
| `widget_type` | `VARCHAR(50)` | — | Enum string (e.g. `LINE_CHART`, `GAUGE`, `CARD`) |
| `data_source` | `VARCHAR(50)` | `"telemetry"` | Source category (e.g. `telemetry`, `alerts`) |
| `query_config` | `JSON` | — | Query configuration parameters (sensors, aggregates) |
| `display_config` | `JSON` | `NULL` | Visual settings parameters (colors, legends, min, max) |
| `refresh_interval`| `INTEGER` | `NULL` | Refresh interval in seconds (optional) |

### Positioning & Grid Layout (Grafana-style)

| Column | Type | Default | Constraints | Notes |
|---|---|---|---|---|
| `position_x` | `INTEGER` | `0` | `>= 0` | X-coordinate on grid |
| `position_y` | `INTEGER` | `0` | `>= 0` | Y-coordinate on grid |
| `width` | `INTEGER` | `4` | `>= 1` | Grid units wide |
| `height` | `INTEGER` | `3` | `>= 1` | Grid units high |

### Status

| Column | Type | Default | Valid values |
|---|---|---|---|
| `status` | `VARCHAR(20)` | `ACTIVE` | `ACTIVE`, `INACTIVE` |

### Composite Constraints & Indexes

- **Composite Unique Key:** `uq_widget_dashboard_code` (`dashboard_id`, `code`)
- **Indexes:**
  - `ix_widgets_name` on `name`
  - `ix_widgets_dashboard_id` on `dashboard_id`
  - `ix_widgets_status` on `status`
  - `ix_widgets_is_active` on `is_active`

---

## API Endpoints

### `POST /dashboards/{dashboard_id}/widgets`

Create a new widget inside a dashboard container.

**Request body** (`WidgetCreate`):
```json
{
    "code": "WIDG01",
    "name": "Line 1 Temp Sensor",
    "title": "Temperature Reading",
    "widget_type": "LINE_CHART",
    "data_source": "telemetry",
    "query_config": {
        "sensors": ["sensor-uuid-abc123"],
        "aggregate": "mean",
        "range": "1h"
    },
    "display_config": {
        "color": "#e02424",
        "show_legend": true
    },
    "refresh_interval": 5,
    "position_x": 0,
    "position_y": 0,
    "width": 6,
    "height": 4
}
```

**Response:** `201 Created` → full `WidgetResponse`

---

### `GET /dashboards/{dashboard_id}/widgets`

List all active widgets configured under a dashboard.

**Response:** `200 OK` → `WidgetListResponse`

---

### `GET /widgets/{widget_id}`

Retrieve details of a single widget by UUID.

---

### `PATCH /widgets/{widget_id}`

Partially update positioning, display, or query parameters.

---

### `DELETE /widgets/{widget_id}`

Soft-deactivates the widget, updating `status = "INACTIVE"` and `is_active = False`.

---

## Business Rules

1. **Dashboard Integrity:** A widget cannot exist without a parent dashboard. Deleting a dashboard propagates a hard deletion of widgets cascading at the database level (`ondelete="CASCADE"`), while soft-deleting the dashboard cascades to soft-deactivate all active child widgets.
2. **Widget Code Scoping:** Code is unique only within the parent Dashboard (`uq_widget_dashboard_code`).
3. **Position Boundaries:** Grid units require non-negative positions (`position_x >= 0`, `position_y >= 0`) and dimensions of at least 1 (`width >= 1`, `height >= 1`).

---

## Error Reference

| Exception | HTTP | Message |
|---|---|---|
| `WidgetNotFound` | `404` | Widget not found. |
| `WidgetCodeConflict` | `409` | Widget code already exists in this dashboard. |
| `DashboardNotFound` | `404` | Dashboard not found. |

---

## Relationships

```
    Dashboard   (dashboards table)
      │
      └── 1:N  (cascade="all, delete-orphan", ondelete="CASCADE")
          │
          ▼
    Widget      (widgets table)
```

---

## File Map

```
backend/app/
├── modules/widgets/
│   ├── __init__.py
│   ├── constants.py
│   ├── dependencies.py                 Dependency provider get_widget_service()
│   ├── api/
│   │   ├── __init__.py
│   │   └── widget_router.py            FastAPI routers
│   ├── models/
│   │   ├── __init__.py
│   │   └── widget.py                   SQLAlchemy Model
│   ├── repositories/
│   │   ├── __init__.py
│   │   └── widget_repository.py        Database queries layer
│   ├── schemas/
│   │   ├── __init__.py
│   │   └── widget.py                   Pydantic validation models
│   └── services/
│       ├── __init__.py
│       └── widget_service.py           Business logic and validation
└── shared/widgets/
    ├── __init__.py
    └── widget_types.py                 Standardized WidgetType categories (Enum)
```

---

## Test Coverage

- **File:** [`tests/test_widget.py`](../backend/tests/test_widget.py)
- **Runner:** `pytest`
- **Result:** 9/9 passed

| Test Suite | Tests Covered |
|---|---|
| `TestCreateWidget` | success, dashboard not found check, duplicate code checks within/across dashboards |
| `TestGetWidget` | widget found, not found check |
| `TestUpdateWidget` | update position and dimensions |
| `TestDeactivateWidget` | soft-deactivate widget (raises WidgetNotFound on get_widget, verified via db refresh) |
| `TestListWidgets` | list by parent dashboard scoping |

---

## Changelog

- **v1.0 (2026-07-12):** Initial implementation, including service-level test suites and API routers.
