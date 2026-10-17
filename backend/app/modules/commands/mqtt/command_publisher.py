import json
import logging
import threading
from typing import Any

from app.config.settings import settings
from app.core.mqtt_client_factory import create_mqtt_client
from app.modules.telemetry.services.mqtt_topic_parser import MqttTopicParser

logger = logging.getLogger(__name__)


class CommandPublisher:

    def __init__(self, client_id: str = "localiot-command-worker"):
        self.client_id = client_id
        self.client = create_mqtt_client(self.client_id)
        self.connected = threading.Event()

        self.client.on_connect = self._on_connect
        self.client.on_disconnect = self._on_disconnect

    def _on_connect(self, client, userdata, flags, rc, *args):
        if rc == 0:
            self.connected.set()
            logger.info(f"Command MQTT publisher '{self.client_id}' connected successfully.")
        else:
            logger.error(f"Command MQTT publisher connection failed with code: {rc}")

    def _on_disconnect(self, client, userdata, rc, *args):
        self.connected.clear()
        logger.warning(f"Command MQTT publisher disconnected (code: {rc}).")

    def start(self) -> None:
        port = getattr(settings, "mqtt_effective_port", settings.mqtt_port)
        self.client.connect(
            host=settings.mqtt_host,
            port=port,
            keepalive=60,
        )
        self.client.loop_start()

    def stop(self) -> None:
        self.client.loop_stop()
        self.client.disconnect()

    def publish(self, command: Any):
        topic = MqttTopicParser.build_command_topic(command.device_id)

        created_at_iso = (
            command.created_at.isoformat()
            if hasattr(command, "created_at") and command.created_at
            else None
        )
        expires_at_iso = (
            command.expires_at.isoformat()
            if hasattr(command, "expires_at") and command.expires_at
            else None
        )

        message = {
            "command_id": str(command.id),
            "command": getattr(command, "command_type", getattr(command, "command", "")),
            "payload": command.payload or {},
            "issued_at": created_at_iso,
            "expires_at": expires_at_iso,
        }

        # CRITICAL: Always use QoS 1 and retain=False
        info = self.client.publish(
            topic,
            json.dumps(message),
            qos=1,
            retain=False,
        )
        return info
