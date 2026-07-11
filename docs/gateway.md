# Gateway Module

> **Version:** 1.0  
> **Status:** ✅ Complete  
> **Last updated:** 2026-07-11

---

## Purpose

The Gateway module represents edge gateways that bridge physical IoT devices to the LocalIoTCloud platform.

Every gateway belongs to a **Project**. A Gateway acts as a central ingestion hub and status tracker for a subset of devices. It manages parameters such as:
- Connection details (IP address, MAC address)
- Location
- Firmware updates
- Status and heartbeat (last seen)
- Connectivity protocols (MQTT, HTTP, COAP, WEBSOCKET, MODBUS, OPC_UA)
- Device-specific topics (MQTT Topic)

---

## Architecture

```
API Router  (gateway_router.py)
    │
    ▼
GatewayService  (gateway_service.py)
    │
    ├── Validation (uniqueness within Project)
    ├── Business Rules (soft-delete, scoping)
    └── Audit Logging (structured logger.info)
    │
    ▼
GatewayRepository  (gateway_repository.py)
    │
    ▼
MySQL  —  gateways table (linked to projects table)
```

**Layer responsibilities:**

| Layer | File | Responsibility | Naming Convention |
|---|---|---|---|
| `models/` | `gateway.py` | SQLAlchemy ORM — database representation | Singular (`Gateway`) |
| `schemas/` | `gateway.py` | Pydantic — validation | `GatewayCreate`, `GatewayUpdate`, `GatewayResponse` |
| `repositories/` | `gateway_repository.py` | SQL queries only (no business logic) | Database-oriented (`exists_by_code`, `list_by_project`) |
| `services/` | `gateway_service.py` | Business rules, transactions, and validation | Business-oriented (`create_gateway`, `deactivate_gateway`) |
| `api/` | `gateway_router.py` | HTTP routing only | HTTP-oriented (`POST /projects/{project_id}/gateways/`) |

---

## Database Schema

**Table:** `gateways`

Inherits `id`, `created_at`, `updated_at`, `is_active` from `BaseModel`.

### Identity & Hierarchy

| Column | Type | Constraints | Default | Notes |
|---|---|---|---|---|
| `id` | `CHAR(36)` | PK | `uuid4()` | UUID, auto-generated |
| `project_id` | `CHAR(36)` | FK, NOT NULL, INDEX | — | References `projects.id` ON DELETE RESTRICT |
| `code` | `VARCHAR(20)` | NOT NULL | — | Unique *within* Project via composite key |
| `name` | `VARCHAR(150)` | NOT NULL, INDEX | — | Gateway display name |
| `description` | `TEXT` | nullable | `NULL` | Gateway description |

### Edge Details

| Column | Type | Constraints | Default | Notes |
|---|---|---|---|---|
| `location` | `VARCHAR(255)` | nullable | `NULL` | Physical location (e.g. Rack A) |
| `ip_address` | `VARCHAR(45)` | nullable | `NULL` | IP address (v4 or v6) |
| `mac_address` | `VARCHAR(17)` | nullable | `NULL` | Hardware MAC address |
| `firmware_version` | `VARCHAR(50)` | nullable | `NULL` | Edge firmware version |

### Lifecycle & Status

| Column | Type | Default | Valid values |
|---|---|---|---|
| `status` | `VARCHAR(20)` | `ACTIVE` | `ACTIVE`, `INACTIVE`, `SUSPENDED`, `TRIAL`, `EXPIRED` |
| `last_seen` | `DATETIME` | `NULL` | Dynamic timestamp of last heartbeat |

### Connectivity

| Column | Type | Default | Valid values |
|---|---|---|---|
| `protocol` | `VARCHAR(20)` | `MQTT` | `MQTT`, `HTTP`, `COAP`, `WEBSOCKET`, `MODBUS`, `OPC_UA` |
| `mqtt_topic` | `VARCHAR(255)` | `NULL` | Ingestion MQTT topic prefix |

### Composite Constraints & Indexes

- **Composite Unique Key:** `uq_gateway_project_code` (`project_id`, `code`)
- **Indexes:**
  - `ix_gateways_name` on `name`
  - `ix_gateways_project_id` on `project_id`
  - `ix_gateways_status` on `status`

---

## API Endpoints

### `POST /projects/{project_id}/gateways/`

Create a new gateway under a specific project.

**Request body** (`GatewayCreate`):

```json
{
    "code": "GW01",
    "name": "Edge Gateway 01",
    "description": "Lab edge gateway",
    "location": "Lab Rack 1",
    "ip_address": "192.168.1.100",
    "mac_address": "AA:BB:CC:DD:EE:FF",
    "firmware_version": "v1.0.0",
    "protocol": "MQTT",
    "mqtt_topic": "gateways/gw01"
}
```

**Response:** `201 Created` → full `GatewayResponse`

**Errors:**

| HTTP | Condition | Message |
|---|---|---|
| `409` | Gateway code already taken in this project | `A gateway with this code already exists in this project.` |

---

### `GET /projects/{project_id}/gateways/`

List all gateways belonging to a specific project.

**Query parameters:**

| Parameter | Type | Default | Description |
|---|---|---|---|
| `search` | `string` | — | Keyword search across name and code (case-insensitive LIKE) |
| `status` | `string` | — | Lifecycle status: `ACTIVE`, `INACTIVE`, `SUSPENDED`, `TRIAL`, `EXPIRED` |
| `protocol` | `string` | — | Connection protocol: `MQTT`, `HTTP`, `COAP`, etc. |
| `page` | `int` | `1` | Page number (1-indexed) |
| `page_size` | `int` | `20` | Items per page (max `200`) |

**Response:** `200 OK` → `GatewayListResponse`

---

### `GET /gateways/{gateway_id}`

Fetch a single gateway by UUID.

**Response:** `200 OK` → `GatewayResponse`

**Errors:**

| HTTP | Condition |
|---|---|
| `404` | ID not found → `GatewayNotFound` |

---

### `PATCH /gateways/{gateway_id}` (or `PUT /gateways/{gateway_id}`)

Partially update a gateway. Only provided fields are modified.

**Updatable fields:** `name`, `description`, `location`, `ip_address`, `mac_address`, `firmware_version`, `status`, `protocol`, `mqtt_topic`.

---

### `DELETE /gateways/{gateway_id}`

Soft-delete a gateway. Sets `is_active = False` and `status = "INACTIVE"`.

**Response:** `200 OK`
```json
{
    "message": "Gateway deactivated successfully."
}
```

---

## Business Rules

1. **Hierarchy Integrity:** Every Gateway must belong to a valid Project. Deleting a project cascades to all gateways, but database-level `ondelete="RESTRICT"` prevents deleting the parent if gateways are referencing it outside of dynamic cascades.
2. **Gateway Code Scoping:** The gateway code is unique only inside its parent Project. Multiple projects can host a gateway with code `GW01`, but a single project cannot have two gateways with code `GW01`.
3. **Soft Delete Policy:** A gateway is never physically deleted. `DELETE` updates `is_active` to `False` and `status` to `INACTIVE`.
4. **Structured Audit Events:** Mutation actions emit structured log events for logging systems.

---

## Error Reference

| Exception | HTTP | Message |
|---|---|---|
| `GatewayNotFound` | `404` | Gateway not found. |
| `GatewayCodeTaken` | `409` | A gateway with this code already exists in this project. |
| `GatewayInactive` | `403` | Gateway is inactive. |

---

## Relationships

```
    Project    (projects table)
      │
      └── 1:N  (cascade="all, delete-orphan", ondelete="RESTRICT")
          │
          ▼
    Gateway    (gateways table)
```

---

## File Map

```
backend/app/
└── modules/gateways/
    ├── __init__.py
    ├── constants.py
    ├── dependencies.py                 Dependency provider get_gateway_service()
    ├── api/
    │   ├── __init__.py
    │   └── gateway_router.py           FastAPI routers (POST/GET/PATCH/DELETE)
    ├── models/
    │   ├── __init__.py
    │   └── gateway.py                  SQLAlchemy Model
    ├── repositories/
    │   ├── __init__.py
    │   └── gateway_repository.py       Database queries following exists_by_* & list_by_* conventions
    ├── schemas/
    │   ├── __init__.py
    │   └── gateway.py                  Pydantic validations
    └── services/
        ├── __init__.py
        └── gateway_service.py          Business logic layer using naming convention
```

---

## Test Coverage

- **File:** [`tests/test_gateway.py`](../backend/tests/test_gateway.py)
- **Runner:** `pytest`
- **Result:** 9/9 passed (SQLite in-memory)

| Test Suite | Tests Covered |
|---|---|
| `TestCreateGateway` | success, duplicate code same project (raises), duplicate code diff project (allowed) |
| `TestGetGateway` | gateway found, gateway not found, get by code |
| `TestUpdateGateway` | update name & IP |
| `TestDeleteGateway` | deactivate soft-delete validation |
| `TestListGateways` | filter by project scoping, filter by protocol |
