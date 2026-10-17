"""
app/modules/commands/mqtt/publisher.py

Publishes command payloads to devices on standardized MQTT topics with QoS 1.
"""

import json
import logging
import paho.mqtt.client as mqtt

from app.config.settings import settings
from app.core.mqtt_client_factory import create_mqtt_client
from app.modules.telemetry.services.mqtt_topic_parser import MqttTopicParser

logger = logging.getLogger(__name__)


class CommandPublisher:
    @staticmethod
    def publish(device_id: str, command_data: dict) -> bool:
        topic = MqttTopicParser.build_command_topic(device_id)
        payload = json.dumps(command_data)

        try:
            client_id = f"{settings.mqtt_client_id}-cmd-pub-{device_id[:8]}"
            client = create_mqtt_client(client_id=client_id)

            port = getattr(settings, "mqtt_effective_port", settings.mqtt_port)
            client.connect(settings.mqtt_host, port, keepalive=60)

            # Publish with QoS 1
            result = client.publish(topic, payload, qos=1)
            client.disconnect()

            if result.rc == mqtt.MQTT_ERR_SUCCESS:
                logger.info(f"Published command to {topic} (QoS 1): {payload}")
                return True
            else:
                logger.error(f"Failed to publish command to {topic}, error code: {result.rc}")
                return False

        except Exception as e:
            logger.error(f"Exception publishing command to MQTT: {e}")
            return False
