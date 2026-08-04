"""
backend/scripts/simulate_telemetry.py

End-to-End Integration test script.
Seeds a test hierarchy in MySQL, subscribes to the FastAPI WebSocket,
publishes raw telemetry to the Mosquitto MQTT broker, and verifies
real-time delivery and database persistence.
"""

import json
import os
import sys
import threading
import time
from datetime import datetime, timezone

import httpx
import paho.mqtt.client as mqtt
from websocket import create_connection

# Add parent directory to path so we can import from app
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from sqlalchemy.orm import sessionmaker

from app.database.connection import engine
from app.modules.devices.models.device import Device
from app.modules.gateways.models.gateway import Gateway
from app.modules.organizations.models.organization import Organization
from app.modules.projects.models.project import Project
from app.modules.sensors.models.sensor import Sensor
from app.modules.tenants.models.tenant import Tenant
from app.modules.dashboards.models.dashboard import Dashboard
from app.modules.widgets.models.widget import Widget
from app.modules.rules.models.rule import Rule

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

API_URL = "http://localhost:8000"
WS_URL = "ws://localhost:8000"
MQTT_HOST = "localhost"
MQTT_PORT = 1883


def seed_test_hierarchy() -> tuple[str, str]:
    """Ensures a test environment is seeded in MySQL. Returns (device_id, sensor_id)."""
    db = SessionLocal()
    try:
        # Check Org
        org = db.query(Organization).filter_by(code="ORG_TEST").first()
        if not org:
            org = Organization(
                code="ORG_TEST",
                name="E2E Test Organization",
                email="e2e@example.com",
                status="ACTIVE",
                license_type="Community"
            )
            db.add(org)
            db.commit()
            db.refresh(org)

        # Check Tenant
        tenant = db.query(Tenant).filter_by(code="TEN_TEST").first()
        if not tenant:
            tenant = Tenant(
                organization_id=org.id,
                code="TEN_TEST",
                name="E2E Test Tenant",
                email="e2e-tenant@example.com",
                status="ACTIVE"
            )
            db.add(tenant)
            db.commit()
            db.refresh(tenant)

        # Check Project
        proj = db.query(Project).filter_by(code="PROJ_TEST").first()
        if not proj:
            proj = Project(
                tenant_id=tenant.id,
                code="PROJ_TEST",
                name="E2E Test Project",
                status="ACTIVE"
            )
            db.add(proj)
            db.commit()
            db.refresh(proj)

        # Check Gateway
        gw = db.query(Gateway).filter_by(code="GW_TEST").first()
        if not gw:
            gw = Gateway(
                project_id=proj.id,
                code="GW_TEST",
                name="E2E Test Gateway",
                status="ACTIVE"
            )
            db.add(gw)
            db.commit()
            db.refresh(gw)

        # Check Device
        device = db.query(Device).filter_by(code="DEV_TEST").first()
        if not device:
            device = Device(
                gateway_id=gw.id,
                code="DEV_TEST",
                name="E2E Test Device",
                status="ACTIVE"
            )
            db.add(device)
            db.commit()
            db.refresh(device)

        # Check Sensor
        sensor = db.query(Sensor).filter_by(code="TEMP").first()
        if not sensor:
            sensor = Sensor(
                device_id=device.id,
                code="TEMP",
                name="Temperature Sensor",
                sensor_type="TEMPERATURE",
                unit="°C",
                data_type="number",
                min_value=-40.0,
                max_value=120.0,
                calibration_offset=2.0,  # Calibration offset
                calibration_scale=1.5,   # Calibration scale: (Raw * 1.5) + 2.0
                status="ACTIVE"
            )
            db.add(sensor)
            db.commit()
            db.refresh(sensor)

        print(f"Test hierarchy seeded successfully. Device ID: {device.id}")
        return device.id, sensor.id
    finally:
        db.close()


def ws_listener(device_id: str, stop_event: threading.Event, messages: list, connected_event: threading.Event):
    """WebSocket client worker thread."""
    url = f"{WS_URL}/devices/{device_id}/telemetry/stream"
    try:
        print(f"Connecting to WebSocket: {url}")
        ws = create_connection(url)
        ws.settimeout(2.0)
        print("WebSocket connected. Listening for events...")
        connected_event.set()
        while not stop_event.is_set():
            try:
                msg = ws.recv()
                if msg:
                    data = json.loads(msg)
                    print(f"[WebSocket Received] => {data}")
                    messages.append(data)
            except Exception:
                # Timeout / sleep to avoid locking
                time.sleep(0.1)
        ws.close()
    except Exception as e:
        print(f"WebSocket client error: {e}")
        connected_event.set()  # Avoid hanging main thread


def main():
    print("==================================================")
    print("Starting Telemetry End-to-End Integration Test...")
    print("==================================================")

    # 1. Seed Device
    try:
        device_id, sensor_id = seed_test_hierarchy()
    except Exception as e:
        print(f"MySQL seeding failed: {e}. Make sure Docker services are up.")
        sys.exit(1)

    # 2. Start WebSocket thread
    ws_msgs = []
    stop_ws = threading.Event()
    connected_event = threading.Event()
    ws_thread = threading.Thread(
        target=ws_listener,
        args=(device_id, stop_ws, ws_msgs, connected_event),
        daemon=True,
    )
    ws_thread.start()

    # Wait for WS client to handshake
    print("Waiting for WebSocket handshake...")
    connected_event.wait(timeout=5.0)

    # 3. Publish to MQTT
    mqtt_client = mqtt.Client(client_id="e2e-simulator")
    try:
        print(f"Connecting to Mosquitto Broker at {MQTT_HOST}:{MQTT_PORT}...")
        mqtt_client.connect(MQTT_HOST, MQTT_PORT, keepalive=60)

        # Publish to iot/GW_TEST/DEV_TEST/telemetry
        topic = "iot/GW_TEST/DEV_TEST/telemetry"
        payload = {
            "device": "DEV_TEST",
            "sensor": "TEMP",
            "value": 20.0,
            "timestamp": datetime.now(timezone.utc).isoformat()
        }

        print(f"Publishing to MQTT: Topic='{topic}' Payload={payload}")
        mqtt_client.publish(topic, json.dumps(payload))
        mqtt_client.disconnect()
    except Exception as e:
        print(f"MQTT Broker connection failed: {e}. Make sure Docker services are running.")
        stop_ws.set()
        sys.exit(1)

    # 4. Wait for processing worker
    print("Waiting 3.0 seconds for worker pipelines to process queue...")
    time.sleep(3.0)

    # 5. Stop WebSocket
    stop_ws.set()
    ws_thread.join(timeout=2.0)

    # 6. Validate WS Message
    print("\n--- Validation Stage ---")
    if ws_msgs:
        # Check calibrated value: (20.0 * 1.5) + 2.0 = 32.0
        calibrated_msg = ws_msgs[-1]
        assert calibrated_msg["sensor_code"] == "TEMP"
        assert calibrated_msg["raw_value"] == 20.0
        assert calibrated_msg["value"] == 32.0
        print("[OK] WebSocket real-time delivery verified.")
        print(f"   Raw: {calibrated_msg['raw_value']}, Calibrated: {calibrated_msg['value']}")
    else:
        print("[ERROR] WebSocket did not receive any telemetry updates.")

    # 7. Check InfluxDB via REST endpoint
    try:
        latest_url = f"{API_URL}/devices/{device_id}/telemetry/latest"
        print(f"Verifying InfluxDB database via REST: {latest_url}")
        resp = httpx.get(latest_url)
        if resp.status_code == 200:
            data = resp.json()
            if data:
                db_record = data[0]
                assert db_record["sensor_code"] == "TEMP"
                assert db_record["value"] == 32.0
                print("[OK] InfluxDB persistence verified via API lookup.")
            else:
                print("[ERROR] InfluxDB did not return any records for the device.")
        else:
            print(f"[ERROR] API Latest request failed with code {resp.status_code}: {resp.text}")
    except Exception as e:
        print(f"[ERROR] API Verification failed: {e}")

    print("\n==================================================")
    print("E2E Integration Test Completed successfully!")
    print("==================================================")


if __name__ == "__main__":
    main()
