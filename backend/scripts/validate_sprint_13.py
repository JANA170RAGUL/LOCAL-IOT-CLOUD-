import asyncio
import json
import os
import sys
import time
import uuid
from datetime import datetime, timezone

import httpx
import websockets
import paho.mqtt.client as mqtt

API_BASE = "http://localhost:8000"
MQTT_HOST = "localhost"
MQTT_PORT = 1883

async def main():
    print("==================================================")
    print("Sprint 13 E2E Integration Validation")
    print("==================================================")

    async with httpx.AsyncClient(base_url=API_BASE) as client:
        test_id = str(uuid.uuid4())[:8]
        # 1. Organizations
        print("[1] Testing Organizations API...")
        org_payload = {"code": f"ORG_{test_id}", "name": f"E2E Org {test_id}", "email": f"e2e_{test_id}@example.com"}
        org_resp = await client.post("/organizations/", json=org_payload)
        assert org_resp.status_code == 201, f"Org create failed: {org_resp.text}"
        org_id = org_resp.json()["id"]

        # 2. Tenants
        print("[2] Testing Tenants API...")
        tenant_payload = {"code": f"TNT_{test_id}", "name": "E2E Test Tenant", "email": f"tenant_{test_id}@example.com"}
        tenant_resp = await client.post(f"/organizations/{org_id}/tenants/", json=tenant_payload)
        assert tenant_resp.status_code == 201, f"Tenant create failed: {tenant_resp.text}"
        tenant_id = tenant_resp.json()["id"]

        # 3. Projects
        print("[3] Testing Projects API...")
        project_payload = {"code": f"PRJ_{test_id}", "name": "E2E Test Project"}
        project_resp = await client.post(f"/tenants/{tenant_id}/projects/", json=project_payload)
        assert project_resp.status_code == 201, f"Project create failed: {project_resp.text}"
        project_id = project_resp.json()["id"]

        # 4. Dashboards & Widgets
        print("[4] Testing Dashboards API...")
        dash_payload = {"code": f"DASH_{test_id}", "name": "E2E Dashboard", "description": "Test Dash", "layout": []}
        dash_resp = await client.post(f"/projects/{project_id}/dashboards", json=dash_payload)
        assert dash_resp.status_code == 201, f"Dashboard create failed: {dash_resp.text}"

        # 5. Gateways
        print("[5] Testing Gateways API...")
        gateway_payload = {"code": f"GW_{test_id}", "name": "E2E Test Gateway", "protocol": "MQTT"}
        gateway_resp = await client.post(f"/projects/{project_id}/gateways/", json=gateway_payload)
        assert gateway_resp.status_code == 201, f"Gateway create failed: {gateway_resp.text}"
        gateway_id = gateway_resp.json()["id"]

        # 6. Devices
        print("[6] Testing Devices API...")
        device_payload = {"code": f"DEV_{test_id}", "name": "E2E Test Device"}
        device_resp = await client.post(f"/gateways/{gateway_id}/devices/", json=device_payload)
        assert device_resp.status_code == 201, f"Device create failed: {device_resp.text}"
        device_id = device_resp.json()["id"]

        # 7. Sensors
        print("[7] Testing Sensors API...")
        sensor_payload = {
            "code": "TEMP",
            "name": "Temperature",
            "sensor_type": "TEMPERATURE",
            "unit": "°C",
            "min_value": -20.0,
            "max_value": 80.0
        }
        sensor_resp = await client.post(f"/devices/{device_id}/sensors/", json=sensor_payload)
        assert sensor_resp.status_code == 201, f"Sensor create failed: {sensor_resp.text}"
        sensor_id = sensor_resp.json()["id"]

        # 8. Rules
        print("[8] Testing Rules API...")
        rule_payload = {
            "code": f"RUL_{test_id}",
            "name": "High Temp Alert",
            "sensor_id": sensor_id,
            "condition": ">",
            "threshold": 40.0,
            "severity": "CRITICAL",
            "enabled": True,
            "cooldown_seconds": 5,
            "action_type": "CREATE_ALERT",
            "action_config": {"message": "Temperature exceeded 40C!"}
        }
        rule_resp = await client.post(f"/projects/{project_id}/rules", json=rule_payload)
        assert rule_resp.status_code == 201, f"Rule create failed: {rule_resp.text}"

        # 9. Telemetry & Alerts WebSockets
        print("[9] Testing WebSockets & Data Pipeline...")
        telemetry_ws_url = f"ws://localhost:8000/devices/{device_id}/telemetry/stream"
        alerts_ws_url = f"ws://localhost:8000/projects/{project_id}/alerts/stream"

        try:
            async with websockets.connect(telemetry_ws_url) as ws_tel, websockets.connect(alerts_ws_url) as ws_alt:
                print("  => Connected to Telemetry and Alert WebSockets")

                # Connect to MQTT
                mqtt_client = mqtt.Client(client_id="e2e-publisher")
                mqtt_client.connect(MQTT_HOST, MQTT_PORT, keepalive=60)
                
                # Publish normal telemetry (below threshold)
                topic = f"iot/GW_{test_id}/DEV_{test_id}/telemetry"
                normal_payload = {
                    "device": f"DEV_{test_id}",
                    "sensor": "TEMP",
                    "value": 25.0,
                    "timestamp": datetime.now(timezone.utc).isoformat()
                }
                mqtt_client.publish(topic, json.dumps(normal_payload))
                
                # Wait for telemetry to arrive
                msg = await asyncio.wait_for(ws_tel.recv(), timeout=5.0)
                msg_data = json.loads(msg)
                assert msg_data["value"] == 25.0, "Telemetry value mismatch"
                print("  => Telemetry stream received normal data successfully.")

                # Publish violation telemetry (above threshold)
                violation_payload = {
                    "device": f"DEV_{test_id}",
                    "sensor": "TEMP",
                    "value": 45.0,
                    "timestamp": datetime.now(timezone.utc).isoformat()
                }
                mqtt_client.publish(topic, json.dumps(violation_payload))
                
                # Wait for alert to arrive
                alt_msg = await asyncio.wait_for(ws_alt.recv(), timeout=5.0)
                alt_data = json.loads(alt_msg)
                assert alt_data["severity"] == "CRITICAL", "Alert severity mismatch"
                print("  => Alert stream received Rule Engine violation successfully.")
                
                mqtt_client.disconnect()
        except Exception as e:
            print(f"WebSocket test failed: {e}")
            raise e

        # Cleanup
        print("[10] Cleaning up E2E data...")
        del_resp = await client.delete(f"/organizations/{org_id}")
        assert del_resp.status_code == 200, f"Cleanup failed: {del_resp.text}"
        
        print("==================================================")
        print("ALL E2E VALIDATIONS PASSED! System is fully integrated.")
        print("==================================================")

if __name__ == "__main__":
    asyncio.run(main())
