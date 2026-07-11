# Sensor Module

> **Version:** 1.0  
> **Status:** ✅ Complete  
> **Last updated:** 2026-07-11

---

## Purpose

The Sensor module represents physical or virtual data channels (measurable signals) exposed by a Device.

While the Device represents physical hardware specs (MAC, IP, serial, etc.), the Sensor acts as the metadata layer defining the signal characteristics. This decoupling allows generic dashboards, charts, rule engine parameters, and analytics to be configured without hardcoding.

Every sensor belongs to exactly one **Device**. The Sensor module tracks:
- Sensor categories/types (e.g. `TEMPERATURE`, `HUMIDITY`, `VOLTAGE`, etc.)
- Engineering units (e.g. `°C`, `%`, `V`, `pH`, `ppm`, `L/min`, etc.)
- Schema definitions (`data_type` like number, boolean, string, json, geo)
- Safety/operational boundaries (min value, max value, default value)
- Sampling rate configuration (`sampling_interval`)
- Dynamic calibration scaling factors (`calibration_offset` and `calibration_scale` to transform raw inputs: `Value = (Raw * Scale) + Offset`)

---

## Architecture

```
API Router  (sensor_router.py)
    │
    ▼
SensorService  (sensor_service.py)
    │
    ├── Validation (uniqueness within Device)
    ├── Business Rules (soft-delete, scoping)
    └── Audit Logging (structured logger.info)
    │
    ▼
SensorRepository  (sensor_repository.py)
    │
    ▼
MySQL  —  sensors table (linked to devices table)
```

**Layer responsibilities:**

| Layer | File | Responsibility | Naming Convention |
|---|---|---|---|
| `models/` | `sensor.py` | SQLAlchemy ORM — database representation | Singular (`Sensor`) |
| `schemas/` | `sensor.py` | Pydantic — validation | `SensorCreate`, `SensorUpdate`, `SensorResponse` |
| `repositories/` | `sensor_repository.py` | SQL queries only (no business logic) | Database-oriented (`exists_by_code`, `list_by_device`) |
| `services/` | `sensor_service.py` | Business rules, transactions, and validation | Business-oriented (`create_sensor`, `deactivate_sensor`) |
| `api/` | `sensor_router.py` | HTTP routing only | HTTP-oriented (`POST /devices/{device_id}/sensors/`) |

---

## Database Schema

**Table:** `sensors`

Inherits `id`, `created_at`, `updated_at`, `is_active` from `BaseModel`.

### Identity & Hierarchy

| Column | Type | Constraints | Default | Notes |
|---|---|---|---|---|
| `id` | `CHAR(36)` | PK | `uuid4()` | UUID, auto-generated |
| `device_id` | `CHAR(36)` | FK, NOT NULL, INDEX | — | References `devices.id` ON DELETE RESTRICT |
| `code` | `VARCHAR(20)` | NOT NULL | — | Unique *within* Device via composite key |
| `name` | `VARCHAR(150)` | NOT NULL, INDEX | — | Sensor display name |

### Metadata & Operations

| Column | Type | Constraints | Default | Notes |
|---|---|---|---|---|
| `sensor_type` | `VARCHAR(50)` | NOT NULL | `CUSTOM` | Category (TEMPERATURE, VOLTAGE, etc.) |
| `unit` | `VARCHAR(20)` | nullable | `NULL` | Measurement symbol (°C, %, pH, V, etc.) |
| `data_type` | `VARCHAR(20)` | NOT NULL | `number` | data schema: number, boolean, string, json, geo |
| `min_value` | `FLOAT` | nullable | `NULL` | Minimum limit constraint |
| `max_value` | `FLOAT` | nullable | `NULL` | Maximum limit constraint |
| `default_value` | `VARCHAR(255)` | nullable | `NULL` | Fallback default reading value |
| `sampling_interval` | `INTEGER` | nullable | `5` | Ingestion poll frequency in seconds |
| `calibration_offset`| `FLOAT` | NOT NULL | `0.0` | Calibration offset addend |
| `calibration_scale` | `FLOAT` | NOT NULL | `1.0` | Calibration scale multiplier |

### Lifecycle & Status

| Column | Type | Default | Valid values |
|---|---|---|---|
| `status` | `VARCHAR(20)` | `ACTIVE` | `ACTIVE`, `INACTIVE`, `SUSPENDED`, `TRIAL`, `EXPIRED` |
| `last_reading_at` | `DATETIME` | `NULL` | Dynamic timestamp of last telemetry payload |

### Composite Constraints & Indexes

- **Composite Unique Key:** `uq_sensor_device_code` (`device_id`, `code`)
- **Indexes:**
  - `ix_sensors_name` on `name`
  - `ix_sensors_device_id` on `device_id`
  - `ix_sensors_status` on `status`

---

## API Endpoints

### `POST /devices/{device_id}/sensors/`

Create a new sensor under a specific device.

**Request body** (`SensorCreate`):

```json
{
    "code": "TEMP",
    "name": "Temperature Sensor",
    "sensor_type": "TEMPERATURE",
    "unit": "°C",
    "data_type": "number",
    "min_value": -40.0,
    "max_value": 125.0,
    "default_value": "25.0",
    "sampling_interval": 5,
    "calibration_offset": 0.2,
    "calibration_scale": 1.0
}
```

**Response:** `201 Created` → full `SensorResponse`

**Errors:**

| HTTP | Condition | Message |
|---|---|---|
| `409` | Sensor code already taken in this device | `A sensor with this code already exists in this device.` |

---

### `GET /devices/{device_id}/sensors/`

List all sensors belonging to a specific device.

**Query parameters:**

| Parameter | Type | Default | Description |
|---|---|---|---|
| `search` | `string` | — | Keyword search across name and code (case-insensitive LIKE) |
| `status` | `string` | — | Lifecycle status: `ACTIVE`, `INACTIVE`, `SUSPENDED`, `TRIAL`, `EXPIRED` |
| `sensor_type` | `string` | — | Filter by sensor type category (e.g. `TEMPERATURE`, `HUMIDITY`, etc.) |
| `page` | `int` | `1` | Page number (1-indexed) |
| `page_size` | `int` | `20` | Items per page (max `200`) |

**Response:** `200 OK` → `SensorListResponse`

---

### `GET /sensors/{sensor_id}`

Fetch a single sensor by UUID.

**Response:** `200 OK` → `SensorResponse`

**Errors:**

| HTTP | Condition |
|---|---|
| `404` | ID not found → `SensorNotFound` |

---

### `PATCH /sensors/{sensor_id}` (or `PUT /sensors/{sensor_id}`)

Partially update a sensor. Only provided fields are modified.

---

### `DELETE /sensors/{sensor_id}`

Soft-delete a sensor. Sets `is_active = False` and `status = "INACTIVE"`.

**Response:** `200 OK`
```json
{
    "message": "Sensor deactivated successfully."
}
```

---

## Business Rules

1. **Hierarchy Integrity:** Every Sensor must belong to a valid Device. Deleting a device cascades to all sensors, but database-level `ondelete="RESTRICT"` prevents deleting the parent if sensors are referencing it outside of dynamic cascades.
2. **Sensor Code Scoping:** The sensor code is unique only inside its parent Device. Multiple devices can host a sensor with code `TEMP`, but a single device cannot have two sensors with code `TEMP`.
3. **Soft Delete Policy:** A sensor is never physically deleted. `DELETE` updates `is_active` to `False` and `status` to `INACTIVE`.
4. **Structured Audit Events:** Mutation actions emit structured log events for logging systems.

---

## Shared IoT Definitions

The platform shares reusable IoT concepts in the `app/shared/iot` package:
- **SensorType:** Standard values (`TEMPERATURE`, `HUMIDITY`, `PRESSURE`, `SOIL_MOISTURE`, `SOIL_PH`, `NPK`, `VOLTAGE`, `CURRENT`, `POWER`, `FLOW`, `LEVEL`, `GPS`, `CUSTOM`)
- **DeviceType:** Hardware options (`ESP32`, `RASPBERRY_PI`, `PLC`, `ARDUINO`, `CUSTOM`)
- **MeasurementUnit:** Common units symbols (`°C`, `°F`, `%`, `pH`, `ppm`, `V`, `A`, `W`, `L/min`, `m`, `kg`, `s`, `custom`)

---

## Error Reference

| Exception | HTTP | Message |
|---|---|---|
| `SensorNotFound` | `404` | Sensor not found. |
| `SensorCodeTaken` | `409` | A sensor with this code already exists in this device. |
| `SensorInactive` | `403` | Sensor is inactive. |

---

## Relationships

```
     Device    (devices table)
      │
      └── 1:N  (cascade="all, delete-orphan", ondelete="RESTRICT")
          │
          ▼
     Sensor    (sensors table)
```

---

## File Map

```
backend/app/
├── shared/iot/
│   ├── __init__.py
│   ├── device_types.py
│   ├── sensor_types.py
│   └── units.py
└── modules/sensors/
    ├── __init__.py
    ├── constants.py
    ├── dependencies.py                 Dependency provider get_sensor_service()
    ├── api/
    │   ├── __init__.py
    │   └── sensor_router.py            FastAPI routers (POST/GET/PATCH/DELETE)
    ├── models/
    │   ├── __init__.py
    │   └── sensor.py                   SQLAlchemy Model
    ├── repositories/
    │   ├── __init__.py
    │   └── sensor_repository.py        Database queries following exists_by_* & list_by_* conventions
    ├── schemas/
    │   ├── __init__.py
    │   └── sensor.py                   Pydantic validations
    └── services/
        ├── __init__.py
        └── sensor_service.py           Business logic layer using naming convention
```

---

## Test Coverage

- **File:** [`tests/test_sensor.py`](../backend/tests/test_sensor.py)
- **Runner:** `pytest`
- **Result:** 9/9 passed (SQLite in-memory)
