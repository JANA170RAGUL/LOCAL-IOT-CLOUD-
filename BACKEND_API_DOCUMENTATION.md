# Local IoT Cloud Platform - Backend API Documentation

Welcome to the official API Documentation for the **Local IoT Cloud Platform**. This document provides detailed information regarding all RESTful API endpoints, request/response formats, authentication mechanisms, telemetry channels, and system administrative interfaces.

---

## 1. System Overview & Architecture

- **Base URL**: `http://localhost:8000/api/v1`
- **Protocol**: HTTP/1.1 & HTTPS, WebSocket, MQTT (`mqtt://localhost:1883`)
- **Data Format**: `application/json`
- **Timezone Standard**: UTC (`ISO 8601` format, e.g. `2026-08-04T09:53:11Z`)

### Authentication & Authorization
The platform enforces role-based access control (RBAC) and multi-tenancy isolation. Requests to protected endpoints must include the standard OAuth2 Bearer Token in the `Authorization` header:

```http
Authorization: Bearer <your_access_token>
```

For telemetry streams and channels, API Keys or ThingSpeak Keys are passed via URL query parameters or HTTP Headers:

```http
X-API-Key: <your_channel_api_key>
```

---

## 2. Authentication API (`/api/v1/auth`)

### 2.1 User Login
Authenticates user credentials and issues JWT Access & Refresh Tokens.

- **Endpoint**: `POST /api/v1/auth/login`
- **Auth Required**: No (Public)
- **Request Body** (`application/json` or `application/x-www-form-urlencoded`):
  ```json
  {
    "username": "admin@localiot.com",
    "password": "Password@123"
  }
  ```
- **Response** (`200 OK`):
  ```json
  {
    "access_token": "eyJhbGciOiJIUzI1Ni...",
    "refresh_token": "eyJhbGciOiJIUzI1Ni...",
    "token_type": "bearer",
    "expires_in": 1800
  }
  ```

### 2.2 Token Refresh
Obtains a new access token using a valid refresh token.

- **Endpoint**: `POST /api/v1/auth/refresh`
- **Auth Required**: No
- **Request Body**:
  ```json
  {
    "refresh_token": "eyJhbGciOiJIUzI1Ni..."
  }
  ```
- **Response** (`200 OK`):
  ```json
  {
    "access_token": "eyJhbGciOiJIUzI1Ni...",
    "token_type": "bearer"
  }
  ```

### 2.3 User Logout
Invalidates the active session token.

- **Endpoint**: `POST /api/v1/auth/logout`
- **Auth Required**: Yes (`Bearer Token`)
- **Response** (`200 OK`):
  ```json
  {
    "message": "Successfully logged out"
  }
  ```

---

## 3. User Management API (`/api/v1/users`)

### 3.1 List Platform Users
Retrieves a paginated list of registered users.

- **Endpoint**: `GET /api/v1/users`
- **Query Parameters**:
  - `search` *(optional)*: Filter by name or email string.
  - `role` *(optional)*: `Super Admin`, `Org Admin`, `Operator`, `Viewer`, `Developer`.
  - `status` *(optional)*: `ACTIVE`, `INACTIVE`.
  - `page` *(default: 1)*: Page number.
  - `page_size` *(default: 20)*: Items per page.
- **Response** (`200 OK`):
  ```json
  {
    "items": [
      {
        "id": "usr_99812",
        "first_name": "Super",
        "last_name": "Admin",
        "email": "admin@localiot.com",
        "phone": "+1555000111",
        "role": "Super Admin",
        "status": "ACTIVE",
        "last_login": "2026-08-04T10:29:57Z"
      }
    ],
    "total": 1,
    "page": 1,
    "total_pages": 1
  }
  ```

### 3.2 Get Current User Profile
Fetches details of the currently authenticated user session.

- **Endpoint**: `GET /api/v1/users/me`
- **Response** (`200 OK`):
  ```json
  {
    "id": "usr_99812",
    "first_name": "Super",
    "last_name": "Admin",
    "email": "admin@localiot.com",
    "role": "Super Admin",
    "status": "ACTIVE"
  }
  ```

### 3.3 Create New User
Registers a new user account with assigned role and temporary password generation option.

- **Endpoint**: `POST /api/v1/users`
- **Request Body**:
  ```json
  {
    "first_name": "John",
    "last_name": "Doe",
    "email": "john.doe@example.com",
    "phone": "+1555123456",
    "role": "Operator",
    "password": "SecurePassword123!"
  }
  ```
- **Response** (`201 Created`):
  ```json
  {
    "id": "usr_10293",
    "first_name": "John",
    "last_name": "Doe",
    "email": "john.doe@example.com",
    "role": "Operator",
    "status": "ACTIVE"
  }
  ```

### 3.4 Change User Password
Updates password for the active user.

- **Endpoint**: `POST /api/v1/users/change-password`
- **Request Body**:
  ```json
  {
    "current_password": "OldPassword123!",
    "new_password": "NewComplexPassword123!",
    "confirm_password": "NewComplexPassword123!"
  }
  ```
- **Response** (`200 OK`):
  ```json
  {
    "message": "Password updated successfully"
  }
  ```

---

## 4. Multi-Tenant Core APIs

### 4.1 Organizations (`/api/v1/organizations`)
Top-level corporate boundaries and billing entities.

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/v1/organizations` | List all organizations with search, status, and license filters. |
| `POST` | `/api/v1/organizations` | Register a new organization account. |
| `GET` | `/api/v1/organizations/{id}` | Get detailed organization profile and metadata. |
| `PUT` | `/api/v1/organizations/{id}` | Update organization details and license tier. |
| `DELETE` | `/api/v1/organizations/{id}` | Soft-deactivate organization and nested tenants. |

#### Create Organization Example Body:
```json
{
  "code": "VYPHERA",
  "name": "VYPHERA_GROUPS",
  "email": "janaragul566@gmail.com",
  "phone": "8610229293",
  "website": "https://vyphera.com",
  "timezone": "Asia/Kolkata",
  "language": "en",
  "currency": "INR",
  "license_type": "Community",
  "status": "ACTIVE"
}
```

---

### 4.2 Tenants (`/api/v1/tenants`)
Workspace containers nested inside organizations.

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/v1/tenants?organization_id={org_id}` | List workspace tenants for an organization. |
| `POST` | `/api/v1/tenants` | Create workspace tenant under an organization. |
| `GET` | `/api/v1/tenants/{id}` | Get tenant workspace configuration. |
| `PUT` | `/api/v1/tenants/{id}` | Update tenant details. |
| `DELETE` | `/api/v1/tenants/{id}` | Soft-delete tenant workspace. |

---

### 4.3 Projects (`/api/v1/projects`)
IoT project scopes containing physical gateways and assets.

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/v1/projects?tenant_id={tenant_id}` | List projects under a tenant. |
| `POST` | `/api/v1/projects` | Create new IoT project. |
| `GET` | `/api/v1/projects/{id}` | Get project profile & asset counts. |
| `PUT` | `/api/v1/projects/{id}` | Update project scope parameters. |
| `DELETE` | `/api/v1/projects/{id}` | Deactivate project. |

---

## 5. IoT Infrastructure Fleet APIs

### 5.1 Gateways (`/api/v1/gateways`)
Manages edge gateways connecting hardware devices.

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/v1/gateways?project_id={project_id}` | List gateways registered to a project. |
| `POST` | `/api/v1/gateways` | Register new edge gateway (MQTT, HTTP, Modbus, etc.). |
| `GET` | `/api/v1/gateways/{id}` | Get gateway connection status, IP, MAC & MQTT topics. |
| `PUT` | `/api/v1/gateways/{id}` | Update gateway network parameters. |
| `DELETE` | `/api/v1/gateways/{id}` | Remove gateway registration. |

---

### 5.2 Devices & Sensors (`/api/v1/devices`, `/api/v1/sensors`)
Physical sensors, telemetry nodes, and actuator endpoints.

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/v1/devices?gateway_id={gateway_id}` | List devices under a gateway. |
| `POST` | `/api/v1/devices` | Register physical sensor node / device. |
| `GET` | `/api/v1/devices/{id}` | Get device status & telemetry metrics. |
| `GET` | `/api/v1/devices/{id}/sensors` | List attached sensors for a device. |
| `POST` | `/api/v1/devices/{id}/sensors` | Attach new sensor telemetry key to a device. |

---

## 6. Telemetry Data & Channels API

### 6.1 Ingestion & History (`/api/v1/telemetry`)
High-throughput time-series data storage engine.

#### Ingest HTTP Telemetry:
- **Endpoint**: `POST /api/v1/telemetry/ingest`
- **Request Body**:
  ```json
  {
    "device_code": "DEV_TEMP_01",
    "timestamp": "2026-08-04T10:45:00Z",
    "metrics": {
      "temperature": 28.5,
      "humidity": 62.1,
      "pressure": 1013.25
    }
  }
  ```

#### Query Time-Series History:
- **Endpoint**: `GET /api/v1/telemetry/history`
- **Query Parameters**:
  - `sensor_id`: Target sensor ID.
  - `start_time`: ISO 8601 start timestamp.
  - `end_time`: ISO 8601 end timestamp.
  - `resolution`: `1m`, `5m`, `1h`, `1d`.

---

### 6.2 Telemetry Channels (`/api/v1/channels`)
ThingSpeak-compatible data streaming channels.

- **`GET /api/v1/channels`**: List user channels.
- **`POST /api/v1/channels`**: Create channel with up to 8 field mappings (`field1` .. `field8`).
- **`GET /api/v1/channels/{id}/feeds.json`**: Get channel feeds & historical charts.
- **`POST /api/v1/channels/{id}/feeds.json`**: Update channel field feeds via HTTP API Key.
- **`POST /api/v1/channels/{id}/keys/regenerate`**: Regenerate channel Read or Write API keys.
- **`POST /api/v1/channels/{id}/import`**: Upload bulk `.csv` feed file.
- **`GET /api/v1/channels/{id}/export`**: Download channel data as `.csv` or `.xlsx`.

---

## 7. Automation Rules & Alerts API (`/api/v1/rules`, `/api/v1/alerts`)

### 7.1 Rules Engine
- **`GET /api/v1/rules`**: List automated trigger rules.
- **`POST /api/v1/rules`**: Create rule condition (e.g. `IF temperature > 40.0 THEN trigger_webhook AND send_email`).

### 7.2 Incident Alerts
- **`GET /api/v1/alerts`**: List critical incident warning events.
- **`POST /api/v1/alerts/{id}/acknowledge`**: Acknowledge active warning.

---

## 8. Reports Export Engine (`/api/v1/reports`)

Generates PDF, Excel, and CSV analytics reports.

- **Endpoint**: `POST /api/v1/reports/export`
- **Request Body**:
  ```json
  {
    "report_type": "telemetry",
    "format": "pdf",
    "filters": {
      "organization_id": "fdea549c-71f6-4ec0-b7d5-006f4f6edd7d",
      "start_date": "2026-08-01",
      "end_date": "2026-08-04"
    }
  }
  ```
- **Response**: Binary File Download (`application/pdf` or `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`).

---

## 9. Platform Administration & Licensing API (`/api/v1/settings`, `/api/v1/licensing`)

### 9.1 Platform Settings
- **`GET /api/v1/settings/{category}`**: Get settings for `general`, `mqtt`, `email`, `branding`, `backup`.
- **`PUT /api/v1/settings/{category}`**: Update settings parameters.

### 9.2 Licensing & Hardware Fingerprint
- **`GET /api/v1/licensing/status`**: Returns current machine fingerprint, license status, days remaining, and feature matrix.
- **`POST /api/v1/licensing/upload`**: Upload vendor `.lic` file (`multipart/form-data`).

---

## 10. Standard Error Response Format

When an API error occurs (`4xx` or `5xx`), the server returns a structured JSON payload:

```json
{
  "status_code": 404,
  "message": "Resource not found",
  "detail": "Organization with ID 'invalid-id' does not exist."
}
```

---

*Local IoT Cloud Platform API Documentation v1.0.0 — Generated 2026.*
