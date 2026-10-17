"""
app/modules/licensing/features.py

Central feature enumeration and feature kind definitions for LocalIoTCloud licensing.
Numeric limits (-1 for unlimited, 0 for disabled, >0 for max capacity)
and boolean flags (true for enabled, false for disabled). Missing features fail closed.
"""

from enum import StrEnum


class LicenseFeature(StrEnum):
    ORGANIZATIONS = "organizations"
    USERS = "users"

    GATEWAYS = "gateways"
    DEVICES = "devices"

    DASHBOARDS = "dashboards"
    WIDGETS = "widgets"

    CHANNELS = "channels"

    TELEMETRY_RATE = "telemetry_rate"

    ANALYTICS = "analytics"
    REPORTS = "reports"
    REMOTE_COMMANDS = "remote_commands"

    AI = "ai"


class FeatureKind(StrEnum):
    LIMIT = "LIMIT"
    FLAG = "FLAG"


FEATURE_DEFINITIONS: dict[LicenseFeature, FeatureKind] = {
    LicenseFeature.ORGANIZATIONS: FeatureKind.LIMIT,
    LicenseFeature.USERS: FeatureKind.LIMIT,
    LicenseFeature.GATEWAYS: FeatureKind.LIMIT,
    LicenseFeature.DEVICES: FeatureKind.LIMIT,
    LicenseFeature.DASHBOARDS: FeatureKind.LIMIT,
    LicenseFeature.WIDGETS: FeatureKind.LIMIT,
    LicenseFeature.CHANNELS: FeatureKind.LIMIT,
    LicenseFeature.TELEMETRY_RATE: FeatureKind.LIMIT,
    LicenseFeature.ANALYTICS: FeatureKind.FLAG,
    LicenseFeature.REPORTS: FeatureKind.FLAG,
    LicenseFeature.REMOTE_COMMANDS: FeatureKind.FLAG,
    LicenseFeature.AI: FeatureKind.FLAG,
}
