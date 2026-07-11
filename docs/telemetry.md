# Telemetry Subsystem

> **Version:** 1.0  
> **Status:** ✅ Complete  
> **Last updated:** 2026-07-11

---

## Purpose

The Telemetry subsystem is the real-time data engine of the LocalIoTCloud platform. Rather than a CRUD-based module, it is a high-performance ingestion, processing, and streaming runtime. 

It receives transient telemetry packets from IoT devices over MQTT or HTTP, validates the payloads, resolves them to active database entities, applies calibration scaling, updates device heartbeats, buffers them in a Redis queue, batch writes them to InfluxDB, and broadcasts them in real time over WebSockets.

---

## Ingestion Flow

```
ESP32 (MQTT/HTTP client)
    │
    ├── (Publish / Ingest)
    ▼
[ Telemetry Ingestion API / MQTT Listener ]
    │
    ├── (JSON Validation - RawTelemetryPayload)
    ▼
[ Redis Queue (telemetry:queue) ]
    │
    ├── (Dequeue Batch - TelemetryWorker)
    ▼
[ Processing Engine ]
    ├── (SensorResolver lookup in MySQL)
    ├── (Apply Calibration Offset & Scale)
    └── (Update Device/Sensor Timestamps)
    │
    ├───┬──────────────────────────┐
    │   ▼ (Batch Point Write)   ▼ (Real-time Broadcast)
    │  [ InfluxDB ]          [ Redis PubSub (telemetry:stream:{device_id}) ]
    ▼                           │
[ Outbound ws/http ] ◄──────────┘ (WebSocket forwarding)
```

---

## Database Configuration

Telemetry uses a hybrid persistence layer:
1. **Metadata & Status Tracking (MySQL):** Device hierarchy metadata, boundaries, calibration factors, `last_seen` timestamps, and `last_reading_at` timestamps.
2. **Buffering & Streaming (Redis):** Telemetry queue list (`telemetry:queue`) and live PubSub channels (`telemetry:stream:{device_id}`).
3. **Time-Series Metric Storage (InfluxDB 2.x):** Metric point histories.

### InfluxDB Data Schema

- **Bucket:** `telemetry`
- **Measurement Name:** `telemetry`
- **Tags:**
  - `device_id` (Device UUID)
  - `gateway_id` (Gateway UUID)
  - `sensor_code` (Sensor code)
  - `sensor_type` (Sensor type category)
- **Fields:**
  - `raw_value` (float/string/bool)
  - `value` (calibrated float/string/bool)

---

## API Endpoints

### `POST /devices/{device_id}/telemetry`

Direct HTTP ingestion endpoint. Enqueues payload to Redis.

**Request body:**

```json
{
    "sensor": "TEMP",
    "value": 30.0,
    "timestamp": "2026-07-12T12:00:01Z"
}
```

**Response:** `202 Accepted`

---

### `GET /devices/{device_id}/telemetry/latest`

Fetch the most recent reading for each active sensor of the device.

**Response:** `200 OK`
```json
[
  {
    "sensor_code": "TEMP",
    "sensor_type": "TEMPERATURE",
    "data_type": "number",
    "value": 32.0,
    "raw_value": 20.0,
    "timestamp": "2026-07-12T12:00:01Z"
  }
]
```

---

### `GET /devices/{device_id}/telemetry/history`

Query historical time-series data with filter boundaries and optional aggregate windowing.

**Query parameters:**

| Parameter | Type | Default | Description |
|---|---|---|---|
| `start_time` | `string` | `-24h` | Lookback offset (e.g. `-24h`, `-30d`) or ISO date-time string |
| `end_time` | `string` | `now()` | Range upper boundary or ISO date-time string |
| `sensor_codes`| `list[str]` | — | Filter for specific sensor codes |
| `aggregation` | `string` | — | Window aggregation function (`mean`, `sum`, `min`, `max`, `count`, `last`) |
| `window` | `string` | — | Aggregation window duration (e.g. `1m`, `1h`, `1d`) |

**Response:** `200 OK` → `TelemetryHistoryResponse`

---

### `WS /devices/{device_id}/telemetry/stream`

Establish a WebSocket connection to receive real-time telemetry updates. The connection subscribes to the Redis PubSub channel `telemetry:stream:{device_id}` and forwards every message.

---

## Core Cooperating Engines

| Engine | File | Responsibility |
|---|---|---|
| **MQTT Listener** | `mqtt_listener.py` | Runs a `paho-mqtt` background loop, subscribing to `iot/+/+/telemetry` to capture and enqueue MQTT payloads. |
| **Queue Manager** | `queue_manager.py` | Enqueues and dequeues batches to/from Redis. |
| **Payload Validator** | `payload_validator.py` | Validates raw payload schemas. |
| **Sensor Resolver** | `sensor_resolver.py` | Resolves string codes to active MySQL models. |
| **Processing Engine** | `processing_engine.py` | Performs calibration (`(Raw * Scale) + Offset`), checks boundaries, and updates MySQL timestamps. |
| **Influx Writer** | `influx_writer.py` | Formats data points and batch-writes to InfluxDB. |
| **Telemetry Worker** | `telemetry_worker.py` | Background polling loop thread that orchestrates resolve, calibration, PubSub publishing, and InfluxDB batches. |

---

## Test Coverage

- **File:** [`tests/test_telemetry.py`](../backend/tests/test_telemetry.py)
- **Runner:** `pytest`
- **Result:** 8/9 passed (SQLite database lookup and mock Redis/InfluxDB APIs)

| Test Suite | Tests Covered |
|---|---|
| `TestPayloadValidator` | validation success, missing fields raises |
| `TestSensorResolver` | resolve by UUID, resolve by code with gateway context, unresolved raises |
| `TestProcessingEngine` | numerical calibration calculation, MySQL timestamp update commits |
| `TestQueueManager` | queue length check, batch pop list pipeline |
| `TestInfluxWriter` | Point format generation and write execution |
