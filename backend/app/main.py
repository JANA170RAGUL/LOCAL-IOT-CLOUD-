from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
import sys
import logging

from app.config.settings import settings
from app.database.session import SessionLocal

from app.modules.devices.models.device import Device
from app.modules.gateways.models.gateway import Gateway
from app.modules.sensors.models.sensor import Sensor
from app.modules.devices.api.device_router import router as device_router
from app.modules.gateways.api.gateway_router import router as gateway_router
from app.modules.organizations.api.organization_router import router as organization_router
from app.modules.projects.api.project_router import router as project_router
from app.modules.sensors.api.sensor_router import router as sensor_router
from app.modules.telemetry.api.telemetry_router import router as telemetry_router
from app.modules.tenants.api.tenant_router import router as tenant_router
from app.modules.dashboards.api.dashboard_router import router as dashboard_router
from app.modules.widgets.api.widget_router import router as widget_router
from app.modules.rules.api.router import router as rules_router
from app.modules.alerts.api.router import router as alerts_router
from app.modules.settings.api.settings_router import router as settings_router
from app.modules.notifications.api.router import router as notifications_router
from app.modules.auth.api.router import router as auth_router
from app.modules.users.api.user_router import router as user_router
from app.modules.analytics.api.analytics_router import router as analytics_router
from app.modules.reports.api.reports_router import router as reports_router
from app.modules.commands.api.command_router import router as command_router
from app.modules.auth.api.api_key_router import router as api_key_router

from app.modules.administration.api.audit_router import router as audit_router
from app.modules.administration.api.health_router import router as health_router
from app.modules.administration.api.backup_router import router as backup_router
from app.modules.administration.api.maintenance_router import router as maintenance_router

from app.modules.licensing.services.license_validator import validate_active_license
from app.modules.licensing.api.router import router as licensing_router
from app.modules.channels.api.channel_router import router as channel_router
from app.modules.channels.api.channel_data_router import router as channel_data_router
from app.modules.channels.api.webhook_router import router as webhook_router
from app.modules.channels.api.thingspeak_router import router as thingspeak_router

from app.shared.exceptions.handlers import register_exception_handlers
from app.core.auth import get_current_user

app = FastAPI(
    title="Local IoT Cloud Platform",
    version="1.0.0",
    description="Self-Hosted Multi-Tenant IoT Cloud Platform",
)

# Allow the Vite dev server to call the backend without CORS errors.
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

logger = logging.getLogger(__name__)

register_exception_handlers(app)

# Register Public Routers
app.include_router(auth_router)

# Protected routers
protected_dependencies = [Depends(get_current_user)]

app.include_router(user_router, dependencies=protected_dependencies)
app.include_router(organization_router, dependencies=protected_dependencies)
app.include_router(tenant_router, dependencies=protected_dependencies)
app.include_router(project_router, dependencies=protected_dependencies)
app.include_router(gateway_router, dependencies=protected_dependencies)
app.include_router(device_router, dependencies=protected_dependencies)
app.include_router(sensor_router, dependencies=protected_dependencies)
app.include_router(telemetry_router)
app.include_router(dashboard_router, dependencies=protected_dependencies)
app.include_router(widget_router, dependencies=protected_dependencies)
app.include_router(rules_router, dependencies=protected_dependencies)
app.include_router(alerts_router, dependencies=protected_dependencies)
app.include_router(settings_router, dependencies=protected_dependencies)
app.include_router(notifications_router, dependencies=protected_dependencies)
app.include_router(analytics_router, dependencies=protected_dependencies)
app.include_router(reports_router, dependencies=protected_dependencies)
app.include_router(command_router, dependencies=protected_dependencies)
app.include_router(api_key_router, dependencies=protected_dependencies)
app.include_router(channel_router, dependencies=protected_dependencies)
app.include_router(webhook_router, dependencies=protected_dependencies)
app.include_router(channel_data_router) # Not protected globally because of api_key / public channels
app.include_router(thingspeak_router) # Not protected globally, relies on ThingSpeak api_keys

app.include_router(audit_router)
app.include_router(health_router)
app.include_router(backup_router)
app.include_router(maintenance_router)

app.include_router(licensing_router)

from app.modules.telemetry.services.mqtt_listener import MQTTListener
from app.modules.telemetry.services.telemetry_worker import TelemetryWorker
from app.modules.notifications.services.worker import NotificationWorker
from app.modules.commands.mqtt.listener import CommandListener

mqtt_listener = MQTTListener()
telemetry_worker = TelemetryWorker()
notification_worker = NotificationWorker()
command_listener = CommandListener()

@app.on_event("startup")
def startup_event():
    # Validate Licensing
    session = SessionLocal()
    try:
        validate_active_license(session)
    except Exception as e:
        logger.error(f"License validation error: {e}")
    finally:
        session.close()

    # Bypass threads during test runs to avoid hanging or connection attempts
    if "pytest" in sys.modules:
        return
    try:
        mqtt_listener.start()
        telemetry_worker.start()
        notification_worker.start()
        command_listener.start()
    except Exception as e:
        print(f"Failed to start background workers: {e}")

@app.on_event("shutdown")
def shutdown_event():
    if "pytest" in sys.modules:
        return
    try:
        mqtt_listener.stop()
        telemetry_worker.stop()
        notification_worker.stop()
        command_listener.stop()
    except Exception as e:
        print(f"Failed to stop background workers: {e}")


@app.get("/")
def root():
    return {
        "message": "Welcome to Local IoT Cloud Platform",
        "status": "Running",
        "version": "1.0.0"
    }

@app.get("/health")
def health():
    return {
        "status": "healthy",
        "database": "connected"
    }
