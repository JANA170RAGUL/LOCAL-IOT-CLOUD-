import json
import logging
import threading
import paho.mqtt.client as mqtt

from app.config.settings import settings
from app.database.session import SessionLocal
from app.modules.commands.services.command_service import CommandService

logger = logging.getLogger(__name__)

class CommandListener:
    def __init__(self):
        # Unique client id to avoid kicking off other clients
        client_id = f"{settings.mqtt_client_id}_cmd"
        self.client = mqtt.Client(client_id=client_id)
        if settings.mqtt_username:
            self.client.username_pw_set(
                username=settings.mqtt_username,
                password=settings.mqtt_password or None,
            )

        self.client.on_connect = self._on_connect
        self.client.on_message = self._on_message
        self.client.on_disconnect = self._on_disconnect

        self._thread = None
        self._stop_event = threading.Event()

    def _on_connect(self, client, userdata, flags, rc):
        if rc == 0:
            logger.info("Successfully connected to MQTT Broker for Commands.")
            topic = "iot/device/+/response"
            self.client.subscribe(topic)
            logger.info(f"Subscribed to topic pattern: {topic}")
        else:
            logger.error(f"MQTT Commands connection failed with code: {rc}")

    def _on_disconnect(self, client, userdata, rc):
        logger.warning(f"Disconnected from MQTT Broker Commands (code: {rc}).")

    def _on_message(self, client, userdata, msg):
        try:
            payload_data = json.loads(msg.payload.decode("utf-8"))
            
            command_id = payload_data.get("command_id")
            if not command_id:
                logger.warning(f"Received command response without command_id on topic {msg.topic}")
                return
                
            db = SessionLocal()
            try:
                CommandService.handle_command_response(db, command_id, payload_data)
            finally:
                db.close()
                
            logger.debug(f"Processed response for command_id: {command_id}")

        except Exception as e:
            logger.error(f"Failed processing MQTT command response: {e}")

    def start(self) -> None:
        logger.info("Starting MQTT Command Listener thread...")
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
        self.client.loop_forever()

    def stop(self) -> None:
        logger.info("Stopping MQTT Command Listener...")
        self.client.disconnect()
        self.client.loop_stop()
        if self._thread:
            self._thread.join(timeout=5.0)
        logger.info("MQTT Command Listener stopped.")
