"""
app/modules/telemetry/services/mqtt_listener.py

MQTT Listener background process.
Subscribes to authenticated device telemetry topics, validates incoming payloads,
resolves gateway context from server DB, and enqueues to Redis.
"""

import json
import logging
import threading

import paho.mqtt.client as mqtt
from sqlalchemy import select

from app.config.settings import settings
from app.core.mqtt_client_factory import create_mqtt_client
from app.database.session import SessionLocal
from app.modules.devices.models.device import Device
from app.modules.sensors.models.sensor import Sensor
from app.modules.telemetry.services.mqtt_topic_parser import MqttTopicParser
from app.modules.telemetry.services.payload_validator import PayloadValidator
from app.modules.telemetry.services.queue_manager import QueueManager

logger = logging.getLogger(__name__)


class MQTTListener:
    """
    Background subscriber service for the Mosquitto MQTT broker.
    Listens on 'localiot/v1/devices/+/telemetry' topics with QoS 1.
    """

    def __init__(self):
        self.client = create_mqtt_client(client_id=settings.mqtt_client_id)

        # Configure callbacks
        self.client.on_connect = self._on_connect
        self.client.on_message = self._on_message
        self.client.on_disconnect = self._on_disconnect

        self._thread = None
        self._stop_event = threading.Event()

    def _on_connect(self, client, userdata, flags, rc):
        if rc == 0:
            logger.info("Successfully connected to MQTT Broker.")
            # Subscribe to standardized telemetry topic with QoS 1
            telemetry_topic = "localiot/v1/devices/+/telemetry"
            self.client.subscribe(telemetry_topic, qos=1)
            logger.info(f"Subscribed to topic pattern: {telemetry_topic} (QoS 1)")
        else:
            logger.error(f"MQTT connection failed with code: {rc}")

    def _on_disconnect(self, client, userdata, rc):
        logger.warning(f"Disconnected from MQTT Broker (code: {rc}).")

    def _on_message(self, client, userdata, msg):
        """On receiving an ingestion payload."""
        try:
            # 1. Parse standardized MQTT topic
            topic = MqttTopicParser.parse(msg.topic)
            if topic.message_type != "telemetry":
                return

            raw_payload = json.loads(msg.payload.decode("utf-8"))
            self.process_mqtt_telemetry(device_id=topic.device_id, payload=raw_payload)

        except Exception as e:
            logger.error(f"Failed processing MQTT telemetry payload on topic {msg.topic}: {e}")

    @staticmethod
    def process_mqtt_telemetry(*, device_id: str, payload: dict) -> bool:
        """
        Processes and validates MQTT telemetry using strict DB verification.
        Closes DB session immediately when finished.
        """
        db = SessionLocal()
        try:
            # 1. Device MUST exist and be ACTIVE
            device = db.get(Device, device_id)
            if not device or device.status != "ACTIVE":
                logger.warning(f"MQTT telemetry rejected: Device {device_id} not found or inactive.")
                return False

            # 2. Extract sensor code from payload
            sensor_code = payload.get("sensor")
            if not sensor_code:
                logger.warning(f"MQTT telemetry rejected: Missing sensor code in payload for device {device_id}.")
                return False

            # 3. Sensor MUST belong to Device and be ACTIVE
            sensor = db.scalar(
                select(Sensor).where(
                    Sensor.device_id == device.id,
                    Sensor.code == sensor_code,
                    Sensor.status == "ACTIVE",
                )
            )
            if not sensor:
                logger.warning(f"MQTT telemetry rejected: Unknown/inactive sensor '{sensor_code}' for device {device.id}.")
                return False

            # 4. Check license telemetry limits
            from app.database.redis import get_redis_client
            from app.modules.licensing.services.telemetry_limiter import check_telemetry_limits
            redis_client = get_redis_client()
            if not check_telemetry_limits(redis_client):
                logger.warning(f"Dropped MQTT telemetry from device {device.id}: License limit exceeded.")
                return False

            # 5. Build SERVER-TRUSTED payload (client cannot override device identity)
            trusted_payload = {
                "device": device.id,
                "sensor": sensor.code,
                "value": payload.get("value"),
                "timestamp": payload.get("timestamp"),
            }

            # 6. Validate structural shape & data type
            validated = PayloadValidator.validate(trusted_payload)

            # 7. Store server-resolved gateway context in envelope
            envelope = {
                "payload": validated,
                "gateway_ctx": device.gateway_id,
                "source": "MQTT",
            }

            QueueManager.enqueue(envelope)
            logger.debug(f"Enqueued MQTT telemetry from device {device.id}, sensor {sensor.code}")
            return True

        except Exception as err:
            logger.exception(f"MQTT telemetry processing failed for device {device_id}: {err}")
            return False

        finally:
            db.close()

    def start(self) -> None:
        """Start the listener in a background thread."""
        logger.info("Starting MQTT Listener thread...")
        self._stop_event.clear()

        # Connect to broker
        self.client.connect(
            host=settings.mqtt_host,
            port=settings.mqtt_effective_port,
            keepalive=60,
        )

        self._thread = threading.Thread(target=self._run_loop, daemon=True)
        self._thread.start()

    def _run_loop(self):
        """Worker loop wrapper."""
        self.client.loop_forever()

    def stop(self) -> None:
        """Disconnect and stop client threads."""
        logger.info("Stopping MQTT Listener...")
        self.client.disconnect()
        self.client.loop_stop()
        if self._thread:
            self._thread.join(timeout=5.0)
        logger.info("MQTT Listener stopped.")
