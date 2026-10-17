# Local IoT Cloud Platform - Developer Handover & Architecture Guide

> **Welcome to the team!** This document serves as a comprehensive developer handover guide for the **Local IoT Cloud Platform**. It details the codebase structure, architectural design, core modules, data flows, background workers, and coding conventions.

---

## 1. Executive Overview & Technology Stack

The **Local IoT Cloud Platform** is a enterprise-grade, self-hosted, multi-tenant IoT management platform. It handles device provisioning, real-time sensor telemetry ingestion via MQTT/HTTP, time-series storage, alert evaluation, command dispatching, and dynamic visual dashboards.

### Core Stack
| Component | Technology | Purpose |
| :--- | :--- | :--- |
| **Backend API** | Python 3.11+, FastAPI, Pydantic v2 | High-performance RESTful API endpoints & OpenAPI docs |
| **ORM & Relational DB** | SQLAlchemy 2.0, Alembic, MySQL 8.4 | Structured metadata (Tenants, Projects, Devices, Sensors) |
| **Time-Series DB** | InfluxDB 2.7 (`influxdb-client`) | High-throughput telemetry measurement storage |
| **Cache & Queue** | Redis 7 (`redis-py`) | Worker job queue (`telemetry:queue`) & session cache |
| **MQTT Broker** | Eclipse Mosquitto v2 (`paho-mqtt`) | MQTTS/TLS sensor communication & command delivery |
| **Frontend UI** | React 18, TypeScript, Vite, TailwindCSS | Real-time monitoring UI & dashboard builder |
| **Reverse Proxy** | Nginx | SSL termination, API routing, static frontend hosting |

---

## 2. Repository Structure

```text
LOCAL-IOT-CLOUD-/
├── backend/                  # FastAPI Backend & Background Workers
│   ├── app/
│   │   ├── api/              # API v1 Router Aggregator
│   │   ├── config/           # Pydantic Settings & Environment Loader
│   │   ├── core/             # Auth Guards, Access Scopes, DB Readiness
│   │   ├── database/         # SQLAlchemy Engine & Session Setup
│   │   ├── modules/          # 24 Domain Modules (Clean Architecture)
│   │   ├── shared/           # Cross-cutting Exceptions & Middlewares
│   │   ├── workers/          # Background Async Processing Workers
│   │   └── main.py           # FastAPI Application Entrypoint
│   ├── alembic/              # Database Schema Migrations
│   ├── scripts/              # Data Seeding & Stress Testing Scripts
│   ├── requirements.txt      # Python Dependencies
│   └── .env                  # Environment Variables
├── frontend/                 # React + TypeScript Frontend Application
│   ├── src/
│   │   ├── components/       # Reusable UI Controls & Modals
│   │   ├── features/         # Domain Feature Components (Dashboards, Devices)
│   │   ├── layouts/          # TopNav, Sidebar, Main Layout
│   │   ├── pages/            # View Pages (Users, Gateways, Alerts)
│   │   ├── services/         # Axios HTTP API Clients
│   │   └── App.tsx           # React Application Router
│   ├── package.json          # Node Dependencies & NPM Scripts
│   └── vite.config.ts        # Vite Build Configuration
├── mosquitto/                # Mosquitto Broker Configuration & Certs
├── deployment/               # Nginx Configurations & Docker Specs
└── docker-compose.yml        # Docker Infrastructure Compose File
```

---

## 3. Backend Architectural Design

The backend strictly follows a **Modular Monolith Pattern**. Each domain functionality resides inside `backend/app/modules/<module_name>/` with a clean separation of concerns:

```text
app/modules/<domain>/
├── api/          # FastAPI Router Endpoints & Request Handlers
├── dependencies.py # Dependency Injection (DB sessions, Service instantiation)
├── models/       # SQLAlchemy Database Entities / Tables
├── repositories/ # Database Access Objects (CRUD Queries)
├── schemas/      # Pydantic Input Validation & Output Serialization DTOs
└── services/     # Core Business Logic & Domain Operations
```

### Key Entry Points & Core Files

#### 1. `backend/app/main.py`
- **Purpose**: Initializes the FastAPI application instance.
- **Key Sections**:
  - `lifespan(app)`: Context manager running production checks and checking active license status at startup.
  - Middleware: Configures `CORSMiddleware` using `settings.cors_origins`.
  - Routers: Mounts `api_v1_router` under prefix `/api/v1`.
  - Health Endpoints: `/healthz` (liveness) and `/readyz` (readiness probing MySQL, Redis, InfluxDB).

#### 2. `backend/app/config/settings.py`
- **Purpose**: Centralized application configuration powered by `pydantic-settings`.
- **Key Properties**:
  - `database_url`: Sync pymysql connection string used by Alembic and sync handlers.
  - `db_async_url`: Async aiomysql connection string.
  - `redis_url`: Redis connection string.
  - `mqtt_effective_port`: Resolves port `8883` (TLS) or `1883` (Non-TLS).

#### 3. `backend/app/core/tenant_guard.py` & `access_scope.py`
- **Purpose**: Enforces multi-tenant data isolation.
- **How it works**: Inspects incoming JWT token claims (`tenant_id`, `user_role`) and prevents unauthorized cross-tenant data access.

---

## 4. Module-by-Module Guide (24 Domain Modules)

| Module | Core Responsibility | Key Files |
| :--- | :--- | :--- |
| **`tenants`** | Manages top-level customer accounts / tenant containers. | `tenant_service.py`, `tenant_router.py` |
| **`organizations`**| Manages organizational sub-units within a tenant. | `organization_service.py` |
| **`projects`** | Groups gateways, devices, and dashboards. | `project_service.py`, `project_router.py` |
| **`gateways`** | Edge hardware gateways bridging local sensor networks. | `gateway_router.py`, `gateway_service.py` |
| **`devices`** | IoT end-node devices, token credentials & heartbeat. | `device_service.py`, `device_credential.py` |
| **`sensors`** | Individual physical/virtual sensors on a device. | `sensor_service.py`, `sensor_router.py` |
| **`channels`** | Sensor data channels & bulk CSV import. | `channel_router.py`, `channel_import.py` |
| **`telemetry`** | Ingests telemetry via HTTP/MQTT, enqueues to Redis. | `mqtt_listener.py`, `queue_manager.py` |
| **`commands`** | Sends asynchronous control commands to devices. | `command_publisher.py`, `command_worker.py` |
| **`alerts`** | Evaluates telemetry threshold rules & fires alerts. | `alert_engine.py`, `alert_router.py` |
| **`notifications`**| Dispatches alerts to Webhooks, Emails, and SMS. | `notification_service.py`, `webhook_dispatcher.py` |
| **`rules`** | Event-Driven Rule Engine (IF metric > threshold THEN action). | `rule_evaluator.py`, `rule_router.py` |
| **`dashboards`**| Dynamic dashboard layouts & panel ordering. | `dashboard_service.py` |
| **`widgets`** | Configurable dashboard charts, gauges, and status cards.| `widget_service.py` |
| **`analytics`** | Aggregates historical telemetry (min, max, avg, count). | `analytics_service.py` |
| **`licensing`** | License validation & tier capacity check (`check_feature_limit`). | `license_validator.py` |
| **`auth`** | User login, JWT token generation, refresh tokens. | `auth_service.py`, `auth_router.py` |
| **`users`** | User profile management & RBAC role assignments. | `user_service.py`, `user_router.py` |
| **`ai_engine`** | ML models for anomaly detection and predictive maintenance. | `anomaly_detector.py` |

---

## 5. Background Workers (`backend/app/workers/`)

The platform uses asynchronous worker threads/processes to handle high-throughput telemetry without blocking HTTP response threads:

1. **`mqtt_worker.py`**:
   - Runs `MQTTListener`.
   - Subscribes to topic `localiot/v1/devices/+/telemetry`.
   - Parses telemetry payloads, verifies device credentials, and pushes raw metrics into Redis queue (`telemetry:queue`).

2. **`telemetry_worker.py`**:
   - Continuously pops telemetry payloads from Redis queue.
   - Batch writes telemetry measurements into **InfluxDB** (`telemetry` bucket).
   - Passes telemetry metrics to the `alert_engine` for real-time rule evaluation.

3. **`command_worker.py`**:
   - Consumes pending command requests from Redis.
   - Publishes command payload over MQTT (`localiot/v1/devices/{device_id}/command`) with QoS 1.

4. **`notification_worker.py`**:
   - Picks up triggered alerts and sends HTTP POST requests to configured external Webhooks or emails.

---

## 6. End-to-End Data Ingestion Flow

```text
[ Sensor / Edge Device ]
           │
           ├── (Option A) MQTT Publish -> localiot/v1/devices/{id}/telemetry
           └── (Option B) HTTP POST -> /api/v1/telemetry/data
           │
           ▼
[ Mosquitto Broker / API Endpoint ]
           │
           ▼
[ MQTT Worker (app.workers.mqtt_worker) ]
           │  Validates device token & schema
           ▼
[ Redis Queue (telemetry:queue) ]
           │
           ▼
[ Telemetry Worker (app.workers.telemetry_worker) ]
           │
           ├──► Batch Write -> InfluxDB ("telemetry" bucket)
           └──► Alert Evaluator -> Triggers Alert if Threshold Exceeded
                                          │
                                          ▼
                               [ Notification Worker ] -> Sends Webhook/Email
```

---

## 7. Developer Cheat Sheet & Quick Start Commands

### Running Local Development Environment

1. **Start Infrastructure in Docker**:
   ```powershell
   docker compose up -d mysql redis influxdb mosquitto
   ```

2. **Run Backend API**:
   ```powershell
   cd backend
   .\.venv\Scripts\Activate.ps1
   uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
   ```

3. **Run Background MQTT Worker**:
   ```powershell
   cd backend
   .\.venv\Scripts\Activate.ps1
   python -m app.workers.mqtt_worker
   ```

4. **Run Frontend Application**:
   ```powershell
   cd frontend
   npm run dev
   ```

5. **Execute Database Migrations**:
   ```powershell
   cd backend
   alembic upgrade head
   ```

---

## 8. Coding Standards & Best Practices

- **Never place business logic in routers**: Keep FastAPI router functions lightweight; delegate business rules to `svc.<method>()` in the service layer.
- **Always enforce Tenant Scope**: Ensure every query or mutation checks `TenantGuard.project(db, project_id, scope)` or filters by `tenant_id`.
- **License Check**: Call `check_feature_limit("<feature_name>", current_count)` before creating tenant-scoped resources (gateways, devices, dashboards).
- **Error Handling**: Raise custom domain exceptions from `app.shared.exceptions` (e.g. `ResourceNotFoundException`, `PermissionDeniedException`) rather than raw `HTTPException`.
