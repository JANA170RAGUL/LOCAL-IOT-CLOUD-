"""
app/api/v1/router.py

Single Central Registry for API v1.
Mounts all domain module routers under standardized /api/v1 paths.
"""

from fastapi import APIRouter, Depends
from app.core.auth import get_current_user

from app.modules.auth.api.router import router as auth_router
from app.modules.auth.api.api_key_router import router as api_key_router

from app.modules.users.api.user_router import router as user_router
from app.modules.organizations.api.organization_router import router as organization_router
from app.modules.tenants.api.tenant_router import router as tenant_router
from app.modules.projects.api.project_router import router as project_router
from app.modules.gateways.api.gateway_router import router as gateway_router
from app.modules.devices.api.device_router import router as device_router
from app.modules.devices.api.device_credentials import router as device_credentials_router
from app.modules.sensors.api.sensor_router import router as sensor_router

from app.modules.telemetry.api.telemetry_router import router as telemetry_router

from app.modules.dashboards.api.dashboard_router import router as dashboard_router
from app.modules.widgets.api.widget_router import router as widget_router

from app.modules.rules.api.router import router as rules_router
from app.modules.alerts.api.router import router as alerts_router
from app.modules.notifications.api.router import router as notifications_router

from app.modules.analytics.api.analytics_router import router as analytics_router
from app.modules.reports.api.reports_router import router as reports_router

from app.modules.commands.api.command_router import router as command_router

from app.modules.settings.api.settings_router import router as settings_router

from app.modules.administration.api.audit_router import router as audit_router
from app.modules.administration.api.health_router import router as admin_health_router
from app.modules.administration.api.backup_router import router as backup_router
from app.modules.administration.api.maintenance_router import router as maintenance_router

from app.modules.licensing.api.router import router as licensing_router

from app.modules.channels.api.channel_router import router as channel_router
from app.modules.channels.api.channel_data_router import router as channel_data_router
from app.modules.channels.api.webhook_router import router as webhook_router
from app.modules.channels.api.thingspeak_router import router as thingspeak_router

from app.modules.ai_engine.api.ai_engine_router import router as ai_engine_router
from app.modules.device_provisioning.api.provisioning_router import router as provisioning_router


api_v1_router = APIRouter()


# ============================================================
# PUBLIC / MIXED-AUTH ROUTERS
# ============================================================

# Auth handles its own endpoint protections (e.g. /me) internally
api_v1_router.include_router(auth_router)

# Telemetry contains mixed auth (X-Device-Key, JWT, WebSocket tickets)
api_v1_router.include_router(telemetry_router)

# Channel data uses channel API keys or public access rules
api_v1_router.include_router(channel_data_router)
api_v1_router.include_router(thingspeak_router)

from app.modules.platform.api.capabilities_router import router as capabilities_router

# Licensing status & upload (checked during bootstrap/install)
api_v1_router.include_router(licensing_router)

# Platform capabilities endpoint
api_v1_router.include_router(capabilities_router)


# ============================================================
# USER-AUTHENTICATED PRODUCT ROUTERS
# ============================================================

user_auth = [Depends(get_current_user)]

api_v1_router.include_router(user_router, dependencies=user_auth)
api_v1_router.include_router(organization_router, dependencies=user_auth)
api_v1_router.include_router(tenant_router, dependencies=user_auth)
api_v1_router.include_router(project_router, dependencies=user_auth)
api_v1_router.include_router(gateway_router, dependencies=user_auth)
api_v1_router.include_router(device_router, dependencies=user_auth)
api_v1_router.include_router(device_credentials_router, dependencies=user_auth)
api_v1_router.include_router(sensor_router, dependencies=user_auth)
api_v1_router.include_router(dashboard_router, dependencies=user_auth)
api_v1_router.include_router(widget_router, dependencies=user_auth)
api_v1_router.include_router(rules_router, dependencies=user_auth)
api_v1_router.include_router(alerts_router, dependencies=user_auth)
api_v1_router.include_router(notifications_router, dependencies=user_auth)
api_v1_router.include_router(analytics_router, dependencies=user_auth)
api_v1_router.include_router(reports_router, dependencies=user_auth)
api_v1_router.include_router(command_router, dependencies=user_auth)
api_v1_router.include_router(settings_router, dependencies=user_auth)
api_v1_router.include_router(api_key_router, dependencies=user_auth)
api_v1_router.include_router(ai_engine_router, dependencies=user_auth)
api_v1_router.include_router(channel_router, dependencies=user_auth)
api_v1_router.include_router(webhook_router, dependencies=user_auth)
api_v1_router.include_router(provisioning_router, dependencies=user_auth)


# ============================================================
# ADMINISTRATION (Enforces system:admin internally)
# ============================================================

api_v1_router.include_router(audit_router)
api_v1_router.include_router(admin_health_router)
api_v1_router.include_router(backup_router)
api_v1_router.include_router(maintenance_router)
