"""
app/modules/commands/mqtt/listener.py

Listens for command execution responses from devices on standardized MQTT topics with QoS 1.
"""

import json
import logging
import threading
import paho.mqtt.client as mqtt

from app.config.settings import settings
from app.core.mqtt_client_factory import create_mqtt_client
from app.database.session import SessionLocal
from app.modules.commands.schemas.command import DeviceCommandResponse
from app.modules.commands.services.command_response_service import CommandResponseService
from app.modules.telemetry.services.mqtt_topic_parser import MqttTopicParser

logger = logging.getLogger(__name__)


class CommandListener:
    def __init__(self, client_id: str = None):
        client_id = client_id or f"{settings.mqtt_client_id}_cmd_resp"
        self.client = create_mqtt_client(client_id=client_id)

        self.client.on_connect = self._on_connect
        self.client.on_message = self._on_message
        self.client.on_disconnect = self._on_disconnect

        self._thread = None
        self._stop_event = threading.Event()

    def _on_connect(self, client, userdata, flags, rc):
        if rc == 0:
            logger.info("Successfully connected to MQTT Broker for Command Responses.")
            response_topic = "localiot/v1/devices/+/responses"
            self.client.subscribe(response_topic, qos=1)
            logger.info(f"Subscribed to topic pattern: {response_topic} (QoS 1)")
        else:
            logger.error(f"MQTT Command Responses connection failed with code: {rc}")

    def _on_disconnect(self, client, userdata, rc):
        logger.warning(f"Disconnected from MQTT Broker Command Responses (code: {rc}).")

    def _on_message(self, client, userdata, msg):
        try:
            topic = MqttTopicParser.parse(msg.topic)
            if topic.message_type != "responses":
                return

            payload_data = json.loads(msg.payload.decode("utf-8"))

            command_id = payload_data.get("command_id")
            if not command_id:
                logger.warning(f"Received command response without command_id on topic {msg.topic}")
                return

            response_obj = DeviceCommandResponse(**payload_data)

            db = SessionLocal()
            try:
                CommandResponseService.handle(
                    db,
                    device_id=topic.device_id,
                    response=response_obj,
                )
            finally:
                db.close()

            logger.debug(f"Processed response for command_id: {command_id} on device {topic.device_id}")

        except Exception as e:
            logger.error(f"Failed processing MQTT command response: {e}")

    def start(self) -> None:
        """Start the listener in a background thread."""
        logger.info("Starting MQTT Commands Listener thread...")
        self._stop_event.clear()

        port = getattr(settings, "mqtt_effective_port", settings.mqtt_port)
        self.client.connect(
            host=settings.mqtt_host,
            port=port,
            keepalive=60,
        )

        self._thread = threading.Thread(target=self._run_loop, daemon=True)
        self._thread.start()

    def _run_loop(self):
        """Worker loop wrapper."""
        self.client.loop_forever()

    def stop(self) -> None:
        """Disconnect and stop client threads."""
        logger.info("Stopping MQTT Commands Listener...")
        self.client.disconnect()
        self.client.loop_stop()
        if self._thread:
            self._thread.join(timeout=5.0)
        logger.info("MQTT Commands Listener stopped.")
