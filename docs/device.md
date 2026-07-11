# Device Module

> **Version:** 1.0  
> **Status:** ✅ Complete  
> **Last updated:** 2026-07-11

---

## Purpose

The Device module represents individual physical IoT devices (e.g. ESP32 microcontroller, Raspberry Pi node) connected via edge gateways to the LocalIoTCloud platform.

Every device belongs to exactly one **Gateway**. The Device module manages:
- System properties (device type, manufacturer, model, serial number)
- Technical hardware and firmware version tracking
- Connection status and network interfaces (IP address, MAC address)
- Status and heartbeat (last seen timestamp for offline detection)

---

## Architecture

```
API Router  (device_router.py)
    │
    ▼
DeviceService  (device_service.py)
    │
    ├── Validation (uniqueness within Gateway)
    ├── Business Rules (soft-delete, scoping)
    └── Audit Logging (structured logger.info)
    │
    ▼
DeviceRepository  (device_repository.py)
    │
    ▼
MySQL  —  devices table (linked to gateways table)
```

**Layer responsibilities:**

| Layer | File | Responsibility | Naming Convention |
|---|---|---|---|
| `models/` | `device.py` | SQLAlchemy ORM — database representation | Singular (`Device`) |
| `schemas/` | `device.py` | Pydantic — validation | `DeviceCreate`, `DeviceUpdate`, `DeviceResponse` |
| `repositories/` | `device_repository.py` | SQL queries only (no business logic) | Database-oriented (`exists_by_code`, `list_by_gateway`) |
| `services/` | `device_service.py` | Business rules, transactions, and validation | Business-oriented (`create_device`, `deactivate_device`) |
| `api/` | `device_router.py` | HTTP routing only | HTTP-oriented (`POST /gateways/{gateway_id}/devices/`) |

---

## Database Schema

**Table:** `devices`

Inherits `id`, `created_at`, `updated_at`, `is_active` from `BaseModel`.

### Identity & Hierarchy

| Column | Type | Constraints | Default | Notes |
|---|---|---|---|---|
| `id` | `CHAR(36)` | PK | `uuid4()` | UUID, auto-generated |
| `gateway_id` | `CHAR(36)` | FK, NOT NULL, INDEX | — | References `gateways.id` ON DELETE RESTRICT |
| `code` | `VARCHAR(20)` | NOT NULL | — | Unique *within* Gateway via composite key |
| `name` | `VARCHAR(150)` | NOT NULL, INDEX | — | Device display name |
| `description` | `TEXT` | nullable | `NULL` | Device description |

### Device Specifications

| Column | Type | Constraints | Default | Notes |
|---|---|---|---|---|
| `device_type` | `VARCHAR(50)` | nullable | `NULL` | Category of device (e.g. sensor_node) |
| `manufacturer` | `VARCHAR(100)` | nullable | `NULL` | Manufacturer name |
| `model` | `VARCHAR(100)` | nullable | `NULL` | Model number/name |
| `serial_number` | `VARCHAR(100)` | nullable | `NULL` | Hardware serial number |
| `firmware_version` | `VARCHAR(50)` | nullable | `NULL` | Firmware version tracking |
| `hardware_version` | `VARCHAR(50)` | nullable | `NULL` | Hardware version tracking |
| `mac_address` | `VARCHAR(17)` | nullable | `NULL` | Hardware MAC address |
| `ip_address` | `VARCHAR(45)` | nullable | `NULL` | Local IP address |

### Lifecycle & Status

| Column | Type | Default | Valid values |
|---|---|---|---|
| `status` | `VARCHAR(20)` | `ACTIVE` | `ACTIVE`, `INACTIVE`, `SUSPENDED`, `TRIAL`, `EXPIRED` |
| `last_seen` | `DATETIME` | `NULL` | Heartbeat timestamp for offline detection |

### Composite Constraints & Indexes

- **Composite Unique Key:** `uq_device_gateway_code` (`gateway_id`, `code`)
- **Indexes:**
  - `ix_devices_name` on `name`
  - `ix_devices_gateway_id` on `gateway_id`
  - `ix_devices_status` on `status`

---

## API Endpoints

### `POST /gateways/{gateway_id}/devices/`

Create a new device under a specific gateway.

**Request body** (`DeviceCreate`):

```json
{
    "code": "DEV01",
    "name": "Node ESP32",
    "description": "ESP32 micro-controller",
    "device_type": "sensor_node",
    "manufacturer": "Espressif",
    "model": "ESP32-WROOM-32D",
    "serial_number": "ESP-32-00123",
    "firmware_version": "v1.2.3",
    "hardware_version": "v2.0",
    "mac_address": "11:22:33:44:55:66",
    "ip_address": "192.168.1.50"
}
```

**Response:** `201 Created` → full `DeviceResponse`

**Errors:**

| HTTP | Condition | Message |
|---|---|---|
| `409` | Device code already taken in this gateway | `A device with this code already exists in this gateway.` |

---

### `GET /gateways/{gateway_id}/devices/`

List all devices belonging to a specific gateway.

**Query parameters:**

| Parameter | Type | Default | Description |
|---|---|---|---|
| `search` | `string` | — | Keyword search across name and code (case-insensitive LIKE) |
| `status` | `string` | — | Lifecycle status: `ACTIVE`, `INACTIVE`, `SUSPENDED`, `TRIAL`, `EXPIRED` |
| `device_type` | `string` | — | Exact match filtering by device type category |
| `page` | `int` | `1` | Page number (1-indexed) |
| `page_size` | `int` | `20` | Items per page (max `200`) |

**Response:** `200 OK` → `DeviceListResponse`

---

### `GET /devices/{device_id}`

Fetch a single device by UUID.

**Response:** `200 OK` → `DeviceResponse`

**Errors:**

| HTTP | Condition |
|---|---|
| `404` | ID not found → `DeviceNotFound` |

---

### `PATCH /devices/{device_id}` (or `PUT /devices/{device_id}`)

Partially update a device. Only provided fields are modified.

**Updatable fields:** `name`, `description`, `device_type`, `manufacturer`, `model`, `serial_number`, `firmware_version`, `hardware_version`, `mac_address`, `ip_address`, `status`.

---

### `DELETE /devices/{device_id}`

Soft-delete a device. Sets `is_active = False` and `status = "INACTIVE"`.

**Response:** `200 OK`
```json
{
    "message": "Device deactivated successfully."
}
```

---

## Business Rules

1. **Hierarchy Integrity:** Every Device must belong to a valid Gateway. Deleting a gateway cascades to all devices, but database-level `ondelete="RESTRICT"` prevents deleting the parent if devices are referencing it outside of dynamic cascades.
2. **Device Code Scoping:** The device code is unique only inside its parent Gateway. Multiple gateways can host a device with code `DEV01`, but a single gateway cannot have two devices with code `DEV01`.
3. **Soft Delete Policy:** A device is never physically deleted. `DELETE` updates `is_active` to `False` and `status` to `INACTIVE`.
4. **Structured Audit Events:** Mutation actions emit structured log events for logging systems.

---

## Error Reference

| Exception | HTTP | Message |
|---|---|---|
| `DeviceNotFound` | `404` | Device not found. |
| `DeviceCodeTaken` | `409` | A device with this code already exists in this gateway. |
| `DeviceInactive` | `403` | Device is inactive. |

---

## Relationships

```
    Gateway    (gateways table)
      │
      └── 1:N  (cascade="all, delete-orphan", ondelete="RESTRICT")
          │
          ▼
     Device    (devices table)
```

---

## File Map

```
backend/app/
└── modules/devices/
    ├── __init__.py
    ├── constants.py
    ├── dependencies.py                 Dependency provider get_device_service()
    ├── api/
    │   ├── __init__.py
    │   └── device_router.py            FastAPI routers (POST/GET/PATCH/DELETE)
    ├── models/
    │   ├── __init__.py
    │   └── device.py                   SQLAlchemy Model
    ├── repositories/
    │   ├── __init__.py
    │   └── device_repository.py        Database queries following exists_by_* & list_by_* conventions
    ├── schemas/
    │   ├── __init__.py
    │   └── device.py                   Pydantic validations
    └── services/
        ├── __init__.py
        └── device_service.py           Business logic layer using naming convention
```

---

## Test Coverage

- **File:** [`tests/test_device.py`](../backend/tests/test_device.py)
- **Runner:** `pytest`
- **Result:** 9/9 passed (SQLite in-memory)

| Test Suite | Tests Covered |
|---|---|
| `TestCreateDevice` | success, duplicate code same gateway (raises), duplicate code diff gateway (allowed) |
| `TestGetDevice` | device found, device not found, get by code |
| `TestUpdateDevice` | update name & model |
| `TestDeleteDevice` | deactivate soft-delete validation |
| `TestListDevices` | filter by gateway scoping, filter by device type |
