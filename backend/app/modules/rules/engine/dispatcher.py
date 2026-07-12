"""
app/modules/rules/engine/dispatcher.py

Executes automation actions triggered by rules.
"""

import json
import logging
from typing import Any
import paho.mqtt.client as mqtt
import httpx
from sqlalchemy.orm import Session
from app.modules.rules.models.rule import Rule
from app.config.settings import settings
from app.database.redis import get_redis_client

logger = logging.getLogger(__name__)


class ActionDispatcher:

    @classmethod
    def dispatch(
        cls,
        db: Session | None,
        rule: Rule,
        value: Any,
        timestamp: str,
        device_id: str | None = None,
    ) -> None:
        """
        Execute actions associated with the rule.
        """
        logger.warning(
            f"Rule Triggered! Rule: '{rule.name}' (Code: {rule.code}), Severity: {rule.severity}, "
            f"Sensor ID: {rule.sensor_id}, Current Value: {value}"
        )

        action_type = rule.action_type.upper()
        config = rule.action_config

        # 1. Create Alert record in MySQL database
        alert_id = None
        if db is not None:
            try:
                from app.modules.alerts.models.alert import Alert
                alert = Alert(
                    rule_id=rule.id,
                    sensor_id=rule.sensor_id,
                    device_id=device_id,
                    severity=rule.severity,
                    title=f"Rule Triggered: {rule.name}",
                    message=f"Sensor value {value} met condition {rule.condition} {rule.threshold}",
                    status="OPEN",
                    acknowledged=False,
                    resolved=False,
                    metadata_json={"telemetry_value": value, "timestamp": timestamp},
                    is_active=True,
                )
                db.add(alert)
                db.commit()
                db.refresh(alert)
                alert_id = alert.id
                logger.info(f"Alert successfully created in database. ID: {alert_id}")
            except Exception as db_err:
                logger.error(f"Failed to create Alert record in database: {db_err}")

        # 2. Publish pub/sub event to Redis so other engines or WebSockets can listen
        try:
            r = get_redis_client()
            event = {
                "alert_id": alert_id,
                "rule_id": rule.id,
                "rule_code": rule.code,
                "rule_name": rule.name,
                "severity": rule.severity,
                "sensor_id": rule.sensor_id,
                "value": value,
                "timestamp": timestamp,
                "action_type": action_type,
                "action_config": config,
            }
            r.publish("rules:triggered", json.dumps(event))
        except Exception as e:
            logger.error(f"Failed to publish rule trigger to Redis pub/sub: {e}")

        # 2. Execute concrete actions
        if action_type == "MQTT" or action_type == "DEVICE_COMMAND":
            cls._publish_mqtt(config)

        elif action_type == "WEBHOOK":
            cls._trigger_webhook(config, event)

        elif action_type == "EMAIL":
            # Stub email sending
            logger.info(f"Sending email notification to: {config.get('recipients', [])}")

        elif action_type == "SMS":
            # Stub SMS sending
            logger.info(f"Sending SMS notification to: {config.get('recipients', [])}")

        elif action_type == "CREATE_ALERT":
            # In Module 11 we will build a full Alert engine; for now, we log it.
            logger.info(f"Alert generated for rule {rule.code}")

    @classmethod
    def _publish_mqtt(cls, config: dict) -> None:
        topic = config.get("topic")
        payload = config.get("payload", "")
        if not topic:
            logger.error("MQTT action configured without topic.")
            return

        try:
            client = mqtt.Client()
            if settings.mqtt_username:
                client.username_pw_set(
                    username=settings.mqtt_username,
                    password=settings.mqtt_password or None,
                )
            client.connect(settings.mqtt_host, settings.mqtt_port, keepalive=60)
            client.publish(topic, payload)
            client.disconnect()
            logger.info(f"MQTT action published to topic '{topic}' with payload '{payload}'.")
        except Exception as e:
            logger.error(f"Failed to publish MQTT command: {e}")

    @classmethod
    def _trigger_webhook(cls, config: dict, payload: dict) -> None:
        url = config.get("url")
        if not url:
            logger.error("Webhook action configured without url.")
            return

        headers = config.get("headers", {"Content-Type": "application/json"})
        method = config.get("method", "POST").upper()

        try:
            if method == "GET":
                httpx.get(url, params=payload, headers=headers, timeout=5)
            else:
                httpx.post(url, json=payload, headers=headers, timeout=5)
            logger.info(f"Webhook action triggered to url: {url}")
        except Exception as e:
            logger.error(f"Webhook execution failed: {e}")
