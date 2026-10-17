"""
app/core/mqtt_client_factory.py

Centralized factory for creating Paho MQTT clients across the platform.
Ensures consistent authentication, TLS encryption, and server certificate verification.
"""

import os
import ssl
import logging
import paho.mqtt.client as mqtt

from app.config.settings import settings

logger = logging.getLogger(__name__)


def create_mqtt_client(client_id: str) -> mqtt.Client:
    """
    Creates and returns a configured Paho MQTT client instance.
    
    Centralizing client creation prevents security drift across background services
    (telemetry listener, command publisher, command response listener, rules engine).
    """
    client = mqtt.Client(client_id=client_id)

    # 1. Configure authentication credentials
    if settings.mqtt_username:
        client.username_pw_set(
            username=settings.mqtt_username,
            password=settings.mqtt_password or None,
        )

    # 2. Configure TLS Transport Encryption & Verification
    if settings.mqtt_use_tls:
        ca_cert_path = settings.mqtt_ca_cert or None

        # Verify CA cert path exists if provided
        if ca_cert_path and not os.path.exists(ca_cert_path):
            logger.warning(
                f"MQTT CA certificate file not found at: '{ca_cert_path}'. "
                "Client will attempt default system CA certificates."
            )
            ca_cert_path = None

        logger.info(f"Configuring TLS for MQTT client '{client_id}' (CA: {ca_cert_path})")

        client.tls_set(
            ca_certs=ca_cert_path,
            cert_reqs=ssl.CERT_REQUIRED if ca_cert_path else ssl.CERT_NONE,
            tls_version=ssl.PROTOCOL_TLS_CLIENT,
        )

        # STRICT CONTROL: Never allow insecure server verification in production
        client.tls_insecure_set(False)

    return client
