"""
backend/scripts/benchmark_telemetry.py

Performance profiling script.
Stresses the MQTT ingestion pipeline by publishing 1000+ messages,
measures Redis queue latency, and logs throughput statistics.
"""

import json
import os
import sys
import time
from datetime import datetime, timezone

import paho.mqtt.client as mqtt
import redis

# Add parent directory to path so we can import from app
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.config.settings import settings

MQTT_HOST = "localhost"
MQTT_PORT = 1883
QUEUE_KEY = "telemetry:queue"


def get_redis_client():
    return redis.Redis(
        host=settings.redis_host,
        port=settings.redis_port,
        password=settings.redis_password or None,
        db=settings.redis_db,
        decode_responses=True
    )


def run_benchmark(num_messages: int = 1000):
    print("==================================================")
    print(f"Starting Telemetry Ingestion Benchmark ({num_messages} msgs)")
    print("==================================================")

    r = get_redis_client()

    # 1. Clear existing queue
    r.delete(QUEUE_KEY)
    print("Pre-cleaning Redis queue...")

    # 2. Connect to MQTT broker
    client = mqtt.Client(client_id="benchmark-publisher")
    try:
        client.connect(MQTT_HOST, MQTT_PORT, keepalive=60)
    except Exception as e:
        print(f"Failed to connect to MQTT broker: {e}. Ensure Docker services are active.")
        sys.exit(1)

    # 3. Publish messages at high speed
    print(f"Publishing {num_messages} payloads to MQTT...")
    topic = "iot/GW_TEST/DEV_TEST/telemetry"

    payload_base = {
        "device": "DEV_TEST",
        "sensor": "TEMP",
        "value": 22.5
    }

    start_time = time.time()
    for i in range(num_messages):
        payload_base["value"] = 20.0 + (i % 10)
        payload_base["timestamp"] = datetime.now(timezone.utc).isoformat()
        client.publish(topic, json.dumps(payload_base))

    # Flush connection
    client.disconnect()
    pub_duration = time.time() - start_time
    pub_rate = num_messages / pub_duration

    print(f"Ingestion Publish Completed in {pub_duration:.2f} seconds.")
    print(f"Publish rate: {pub_rate:.2f} messages/sec.")

    # 4. Monitor worker queue processing clearance
    print("\nMonitoring queue clearance speed in Redis...")
    start_clear = time.time()

    peak_queue_len = r.llen(QUEUE_KEY)
    print(f"Initial queue length in Redis: {peak_queue_len}")

    last_len = peak_queue_len
    while True:
        curr_len = r.llen(QUEUE_KEY)
        if curr_len == 0:
            break

        # Log progress if changed
        if curr_len != last_len and curr_len % 200 == 0:
            print(f"  Queue remaining: {curr_len} items...")
            last_len = curr_len

        time.sleep(0.1)

    clear_duration = time.time() - start_clear
    clear_rate = peak_queue_len / clear_duration if clear_duration > 0 else 0

    print(f"Queue cleared in {clear_duration:.2f} seconds.")
    print(f"Worker processing rate: {clear_rate:.2f} messages/sec.")
    print("==================================================")


if __name__ == "__main__":
    count = 1000
    if len(sys.argv) > 1:
        try:
            count = int(sys.argv[1])
        except ValueError:
            pass
    run_benchmark(count)
