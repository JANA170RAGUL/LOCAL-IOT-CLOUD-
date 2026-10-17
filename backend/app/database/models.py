"""
app/database/models.py

Central imports for all SQLAlchemy models across modules.
Importing this module registers all models with SQLAlchemy Base metadata
and configures relationship mappers across independent modules.
"""

from app.modules.users.models.user import User
from app.modules.organizations.models.organization import Organization
from app.modules.tenants.models.tenant import Tenant
from app.modules.projects.models.project import Project
from app.modules.gateways.models.gateway import Gateway
from app.modules.devices.models.device import Device
from app.modules.devices.models.device_credential import DeviceCredential
from app.modules.sensors.models.sensor import Sensor
from app.modules.dashboards.models.dashboard import Dashboard
from app.modules.widgets.models.widget import Widget
from app.modules.rules.models.rule import Rule
from app.modules.alerts.models.alert import Alert
from app.modules.settings.models.setting import Setting
from app.modules.notifications.models.notification import (
    NotificationTemplate,
    Notification,
    UserNotificationPreference,
)
from app.modules.commands.models.command import DeviceCommand
from app.modules.channels.models.channel import (
    Channel,
    ChannelField,
    ChannelApiKey,
    ChannelWebhook,
    WebhookDeliveryLog,
)
from app.modules.auth.models.api_key import ApiKey
from app.modules.auth.models.login_history import LoginHistory
from app.modules.auth.models.password_history import PasswordHistory
from app.modules.auth.models.user_session import UserSession
from app.modules.auth.models.verification_token import VerificationToken
from app.modules.licensing.models.license import License
from app.modules.licensing.models.license_activation import LicenseActivation
from app.modules.licensing.models.license_feature import LicenseFeature
from app.modules.licensing.models.machine_fingerprint import MachineFingerprint
from app.modules.administration.models.audit_log import AuditLog
from app.modules.administration.models.activity_log import ActivityLog
from app.modules.device_provisioning.models.device_connection import DeviceConnection
from app.modules.device_provisioning.models.provisioning_job import ProvisioningJob
from app.modules.device_provisioning.models.device_agent import DeviceAgent
from app.modules.device_provisioning.models.hardware_component import HardwareComponent

__all__ = [
    "User",
    "Organization",
    "Tenant",
    "Project",
    "Gateway",
    "Device",
    "DeviceCredential",
    "Sensor",
    "Dashboard",
    "Widget",
    "Rule",
    "Alert",
    "Setting",
    "NotificationTemplate",
    "Notification",
    "UserNotificationPreference",
    "DeviceCommand",
    "Channel",
    "ChannelField",
    "ChannelApiKey",
    "ChannelWebhook",
    "WebhookDeliveryLog",
    "ApiKey",
    "LoginHistory",
    "PasswordHistory",
    "UserSession",
    "VerificationToken",
    "License",
    "LicenseActivation",
    "LicenseFeature",
    "MachineFingerprint",
    "AuditLog",
    "ActivityLog",
    "DeviceConnection",
    "ProvisioningJob",
    "DeviceAgent",
    "HardwareComponent",
]

