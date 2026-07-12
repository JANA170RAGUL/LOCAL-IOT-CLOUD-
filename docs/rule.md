# Rule Engine Module

> **Version:** 1.0  
> **Status:** ✅ Complete  
> **Last updated:** 2026-07-12

---

## Purpose

The Rule Engine module acts as the automation brain of the LocalIoTCloud platform. It processes incoming telemetry data points, evaluates them against threshold rules defined by users, and triggers actions (like publishing MQTT commands, firing HTTP webhooks, or generating alerts) while applying a cooldown mechanism to prevent spamming notifications.

---

## Architecture

```
Telemetry Ingestion (MQTT / HTTP)
    │
    ▼
Telemetry Worker (telemetry_worker.py)
    │
    ├── Normalize payload & get sensor_id (processing_engine.py)
    └── Invoke Rule Engine Runner
            │
            ▼
      RuleEngineRunner (runner.py)
            │
            ├── 1. Load active rules (rule_loader.py)
            ├── 2. Evaluate condition (evaluator.py)
            │      └── Stateful comparisons check Redis last_value
            ├── 3. Enforce cooldown (cooldown.py)
            │      └── Set/Check TTL key in Redis
            └── 4. Dispatch actions (dispatcher.py)
                   └── Publish Redis event, execute Webhook, or publish MQTT command
```

**Layer responsibilities:**

| Component | File / Directory | Responsibility |
|---|---|---|
| **ORM Model** | `models/rule.py` | SQLAlchemy database model representation. |
| **Validation** | `schemas/rule.py` | Pydantic schemas validating structure, operators, severities, and configs. |
| **Data Layer** | `repositories/rule_repository.py` | SQL query mappings (listing, checking codes, fetching sensor active rules). |
| **Service Layer**| `services/rule_service.py` | Rule CRUD business validation and status management. |
| **API Layer** | `api/router.py` | Endpoint handlers and routing logic. |
| **Engine Loader**| `engine/rule_loader.py` | Resolves enabled, active rules from MySQL for a sensor. |
| **Evaluator** | `engine/evaluator.py` | Performs comparisons (`>`, `<`, `BETWEEN`, `IN`, `CHANGED`, etc.) using current value and Redis last value. |
| **Cooldown** | `engine/cooldown.py` | Handles checking and setting cooldown flags via Redis keys (`rule:cooldown:{rule_id}`). |
| **Dispatcher** | `engine/dispatcher.py` | Executes target action payloads (MQTT command, webhook trigger, or log stub). |
| **Runner** | `engine/runner.py` | Coordinates loader, evaluator, cooldown, and dispatcher per telemetry packet. |

---

## Database Schema

**Table:** `rules`

Inherits `id`, `created_at`, `updated_at`, `is_active` from `BaseModel`.

### Identity & Hierarchy

| Column | Type | Constraints | Default | Notes |
|---|---|---|---|---|
| `id` | `CHAR(36)` | PK | `uuid4()` | UUID, auto-generated |
| `project_id` | `CHAR(36)` | FK, NOT NULL, INDEX | — | References `projects.id` ON DELETE RESTRICT |
| `sensor_id` | `CHAR(36)` | FK, NOT NULL, INDEX | — | References `sensors.id` ON DELETE RESTRICT |
| `code` | `VARCHAR(50)` | NOT NULL | — | Unique *within* Project via composite key |
| `name` | `VARCHAR(100)` | NOT NULL, INDEX | — | Rule display name |
| `description` | `TEXT` | nullable | `NULL` | Detailed description |

### Logic & Cooldown

| Column | Type | Default | Notes |
|---|---|---|---|
| `condition` | `VARCHAR(20)` | — | Comparison operator (e.g. `>`, `BETWEEN`, `CHANGED`) |
| `threshold` | `DOUBLE` | — | Base comparison threshold float |
| `severity` | `VARCHAR(20)` | `INFO` | Severity: `INFO`, `WARNING`, `CRITICAL`, `EMERGENCY` |
| `enabled` | `BOOLEAN` | `TRUE` | Enable/disable evaluation state |
| `cooldown_seconds`| `INTEGER` | `60` | Duration to ignore repeat triggers |

### Actions

| Column | Type | Notes |
|---|---|---|
| `action_type` | `VARCHAR(20)` | Action type (e.g. `EMAIL`, `MQTT`, `WEBHOOK`, `CREATE_ALERT`) |
| `action_config` | `JSON` | Config options (e.g. list of recipients, MQTT topic/payload, webhook URL) |

### Status

| Column | Type | Default | Valid values |
|---|---|---|---|
| `status` | `VARCHAR(20)` | `ACTIVE` | `ACTIVE`, `INACTIVE` |

### Composite Constraints & Indexes

- **Composite Unique Key:** `uq_rule_project_code` (`project_id`, `code`)
- **Indexes:**
  - `ix_rules_name` on `name`
  - `ix_rules_project_id` on `project_id`
  - `ix_rules_sensor_id` on `sensor_id`
  - `ix_rules_status` on `status`

---

## API Endpoints

### `POST /projects/{project_id}/rules`

Create a new rule inside a project.

**Request body** (`RuleCreate`):
```json
{
    "code": "HIGH_TEMP",
    "name": "High Temperature Warning",
    "description": "Trigger alert when temperature exceeds 40C",
    "sensor_id": "sensor-uuid-1234",
    "condition": ">",
    "threshold": 40.0,
    "severity": "CRITICAL",
    "enabled": true,
    "cooldown_seconds": 120,
    "action_type": "MQTT",
    "action_config": {
        "topic": "iot/ventilation/fan/cmd",
        "payload": "ON"
    }
}
```

**Response:** `201 Created` → full `RuleResponse`

---

### `GET /projects/{project_id}/rules`

List rules belonging to a project. Supports search, pagination, and status/enabled filtering.

---

### `GET /rules/{rule_id}`

Fetch details of a single rule by UUID.

---

### `PATCH /rules/{rule_id}`

Partially update rule configurations.

---

### `DELETE /rules/{rule_id}`

Soft-deactivates the rule, updating `status = "INACTIVE"` and `is_active = False`.

---

## Business Rules

1. **Scoping:** A rule requires a valid parent Project and a valid parent Sensor. If the parent sensor or project is inactive/deactivated, rule execution is skipped.
2. **Rule Code Scoping:** Code is unique only inside the parent Project. Two different projects can define a rule with code `TEMP_CHECK`.
3. **Operators & Stateful Evaluation:**
   - Standard numeric operators compare incoming telemetry directly against `threshold`.
   - `BETWEEN` uses `threshold` as lower limit and `action_config["upper_threshold"]` as upper limit.
   - `IN`/`NOT_IN` check if the value matches items inside `action_config["list"]`.
   - Stateful conditions (`CHANGED`, `INCREASED`, `DECREASED`) compare the current telemetry value against the last telemetry value for this sensor, cached in Redis key `sensor:last_value:{sensor_id}`.
4. **Action Cooldown:** To prevent warning flooding (e.g. sending 100 emails for a temperature stream at 42C), when a rule triggers, a Redis key `rule:cooldown:{rule_id}` is set with a TTL of `cooldown_seconds`. Subsequent triggers are ignored while this key exists.

---

## Error Reference

| Exception | HTTP | Message |
|---|---|---|
| `RuleNotFound` | `404` | Rule not found. |
| `RuleCodeConflict` | `409` | Rule code already exists in this project. |
| `ProjectNotFound` | `404` | Project not found. |
| `SensorNotFound` | `404` | Sensor not found. |

---

## Relationships

```
    Project     (projects table)
      │
      └── 1:N  (cascade="all, delete-orphan", ondelete="RESTRICT")
          │
          ▼
    Rule        (rules table)
          ▲
          └── N:1  (cascade="all, delete-orphan", ondelete="RESTRICT")
              │
    Sensor      (sensors table)
```

---

## File Map

```
backend/app/modules/rules/
├── __init__.py
├── constants.py
├── dependencies.py                 Dependency provider get_rule_service()
├── api/
│   ├── __init__.py
│   └── router.py                   FastAPI router (CRUD endpoints)
├── engine/
│   ├── __init__.py
│   ├── cooldown.py                 Check/set cooldown keys in Redis
│   ├── dispatcher.py               Execute actions (MQTT client, HTTP Webhook, PubSub)
│   ├── evaluator.py                Perform operators logic and state checks
│   ├── rule_loader.py              Query active sensor rules from DB
│   └── runner.py                   Evaluator orchestrator
├── models/
│   ├── __init__.py
│   └── rule.py                     SQLAlchemy Model
├── repositories/
│   ├── __init__.py
│   └── rule_repository.py          Database queries layer
└── schemas/
    ├── __init__.py
    └── rule.py                     Pydantic validation schemas
```

---

## Test Coverage

- **File:** [`tests/test_rule.py`](../backend/tests/test_rule.py)
- **Runner:** `pytest`
- **Result:** 12/12 passed (100% green)

| Test Suite | Tests Covered |
|---|---|
| `TestRuleCRUD` | success create, project/sensor missing check, duplicate code check, update rule parameters, soft delete/deactivate |
| `TestRuleEvaluator` | numeric comparisons, BETWEEN operator boundary checking, IN operator checks, stateful CHANGED/INCREASED/DECREASED checks using mock Redis |
| `TestCooldownManager` | check is_in_cooldown flag, set cooldown TTL key check |
| `TestRuleEngineRunner` | run evaluation with mock telemetry record, assert dispatch triggers when thresholds are exceeded |

---

## Changelog

- **v1.0 (2026-07-12):** Initial implementation, including Rule loader, evaluator, Redis cooldown manager, MQTT/Webhook action dispatcher, and integration into the background telemetry worker.
