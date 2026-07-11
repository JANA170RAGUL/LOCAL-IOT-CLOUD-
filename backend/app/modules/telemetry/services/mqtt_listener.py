"""
app/modules/telemetry/services/mqtt_listener.py

MQTT Listener background process.
Subscribes to device telemetry topics, validates incoming payloads,
resolves gateway context from topic segments, and enqueues to Redis.
"""

import json
import logging
import threading
import paho.mqtt.client as mqtt

from app.config.settings import settings
from app.modules.telemetry.services.payload_validator import PayloadValidator
from app.modules.telemetry.services.queue_manager import QueueManager

logger = logging.getLogger(__name__)


class MQTTListener:
    """
    Background subscriber service for the Mosquitto MQTT broker.
    Listens on 'iot/{gateway}/{device}/telemetry' topics.
    """

    def __init__(self):
        self.client = mqtt.Client(client_id=settings.mqtt_client_id)
        if settings.mqtt_username:
            self.client.username_pw_set(
                username=settings.mqtt_username,
                password=settings.mqtt_password or None,
            )
        
        # Configure callbacks
        self.client.on_connect = self._on_connect
        self.client.on_message = self._on_message
        self.client.on_disconnect = self._on_disconnect

        self._thread = None
        self._stop_event = threading.Event()

    def _on_connect(self, client, userdata, flags, rc):
        if rc == 0:
            logger.info("Successfully connected to MQTT Broker.")
            # Subscribe to iot/{gateway_code}/{device_code}/telemetry
            # '+' matches any single level wildcard
            topic = "iot/+/+/telemetry"
            self.client.subscribe(topic)
            logger.info(f"Subscribed to topic pattern: {topic}")
        else:
            logger.error(f"MQTT connection failed with code: {rc}")

    def _on_disconnect(self, client, userdata, rc):
        logger.warning(f"Disconnected from MQTT Broker (code: {rc}).")

    def _on_message(self, client, userdata, msg):
        """On receiving an ingestion payload."""
        try:
            topic_parts = msg.topic.split("/")
            if len(topic_parts) < 4:
                return

            gateway_ctx = topic_parts[1]
            device_code_ctx = topic_parts[2]

            payload_data = json.loads(msg.payload.decode("utf-8"))
            
            # Enforce device identifier in payload if missing, fallback to topic segment
            if "device" not in payload_data:
                payload_data["device"] = device_code_ctx

            # Validate structural shape
            validated = PayloadValidator.validate(payload_data)

            # Store gateway context inside payload envelope metadata
            envelope = {
                "payload": validated,
                "gateway_ctx": gateway_ctx,
            }

            # Push directly to queue
            QueueManager.enqueue(envelope)
            logger.debug(f"Enqueued telemetry message from device: {validated['device']}")

        except Exception as e:
            logger.error(f"Failed processing MQTT telemetry payload: {e}")

    def start(self) -> None:
        """Start the listener in a background thread."""
        logger.info("Starting MQTT Listener thread...")
        self._stop_event.clear()
        
        # Connect to broker
        self.client.connect(
            host=settings.mqtt_host,
            port=settings.mqtt_effective_port(),
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
