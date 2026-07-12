from fastapi import FastAPI

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
from app.shared.exceptions.handlers import register_exception_handlers

app = FastAPI(
    title="Local IoT Cloud Platform",
    version="1.0.0",
    description="Self-Hosted Multi-Tenant IoT Cloud Platform",
)

register_exception_handlers(app)

# Register Routers
app.include_router(organization_router)
app.include_router(tenant_router)
app.include_router(project_router)
app.include_router(gateway_router)
app.include_router(device_router)
app.include_router(sensor_router)
app.include_router(telemetry_router)
app.include_router(dashboard_router)
app.include_router(widget_router)
app.include_router(rules_router)
app.include_router(alerts_router)


import sys

from app.modules.telemetry.services.mqtt_listener import MQTTListener
from app.modules.telemetry.services.telemetry_worker import TelemetryWorker

mqtt_listener = MQTTListener()
telemetry_worker = TelemetryWorker()


@app.on_event("startup")
def startup_event():
    # Bypass threads during test runs to avoid hanging or connection attempts
    if "pytest" in sys.modules:
        return
    try:
        mqtt_listener.start()
    except Exception as e:
        print(f"MQTT Listener failed to start: {e}")

    try:
        telemetry_worker.start()
    except Exception as e:
        print(f"Telemetry Worker failed to start: {e}")


@app.on_event("shutdown")
def shutdown_event():
    if "pytest" in sys.modules:
        return
    try:
        mqtt_listener.stop()
    except Exception as e:
        print(f"MQTT Listener failed to stop: {e}")

    try:
        telemetry_worker.stop()
    except Exception as e:
        print(f"Telemetry Worker failed to stop: {e}")


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
