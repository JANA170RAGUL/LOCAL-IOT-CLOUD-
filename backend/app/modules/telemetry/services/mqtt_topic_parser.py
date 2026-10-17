"""
app/modules/telemetry/services/mqtt_topic_parser.py

Parses and validates standardized MQTT topics.
Structure: localiot/v1/devices/{device_id}/{message_type}
"""

from dataclasses import dataclass


@dataclass(frozen=True)
class MqttTopic:
    device_id: str
    message_type: str


class MqttTopicParser:

    PREFIX = (
        "localiot",
        "v1",
        "devices",
    )

    ALLOWED_TYPES = {
        "telemetry",
        "responses",
        "status",
        "commands",
    }

    @classmethod
    def parse(cls, topic: str) -> MqttTopic:
        parts = topic.split("/")

        if len(parts) != 5:
            raise ValueError(f"Invalid MQTT topic structure '{topic}'. Expected 5 segments.")

        if tuple(parts[:3]) != cls.PREFIX:
            raise ValueError(f"Invalid MQTT topic prefix '{topic}'. Expected 'localiot/v1/devices'.")

        device_id = parts[3].strip()
        message_type = parts[4].strip()

        if not device_id:
            raise ValueError(f"Missing device ID in MQTT topic '{topic}'.")

        if message_type not in cls.ALLOWED_TYPES:
            raise ValueError(f"Invalid MQTT message type '{message_type}' in topic '{topic}'.")

        return MqttTopic(
            device_id=device_id,
            message_type=message_type,
        )

    @classmethod
    def build_command_topic(cls, device_id: str) -> str:
        return f"localiot/v1/devices/{device_id}/commands"

    @classmethod
    def build_telemetry_topic(cls, device_id: str) -> str:
        return f"localiot/v1/devices/{device_id}/telemetry"

    @classmethod
    def build_response_topic(cls, device_id: str) -> str:
        return f"localiot/v1/devices/{device_id}/responses"
