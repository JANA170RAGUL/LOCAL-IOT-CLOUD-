import json
import logging
import paho.mqtt.client as mqtt

from app.config.settings import settings

logger = logging.getLogger(__name__)

class CommandPublisher:
    @staticmethod
    def publish(device_id: str, command_data: dict) -> bool:
        topic = f"iot/device/{device_id}/command"
        payload = json.dumps(command_data)
        
        try:
            client = mqtt.Client()
            if settings.mqtt_username:
                client.username_pw_set(
                    username=settings.mqtt_username,
                    password=settings.mqtt_password or None,
                )
            
            # Using mqtt_effective_port to match the listener
            port = getattr(settings, "mqtt_effective_port", settings.mqtt_port)
            client.connect(settings.mqtt_host, port, keepalive=60)
            
            result = client.publish(topic, payload)
            client.disconnect()
            
            if result.rc == mqtt.MQTT_ERR_SUCCESS:
                logger.info(f"Published command to {topic}: {payload}")
                return True
            else:
                logger.error(f"Failed to publish command to {topic}, error code: {result.rc}")
                return False
                
        except Exception as e:
            logger.error(f"Exception publishing command to MQTT: {e}")
            return False
