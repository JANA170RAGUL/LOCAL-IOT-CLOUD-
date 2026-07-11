from fastapi import FastAPI

from app.modules.organizations.api.organization_router import router as organization_router
from app.modules.tenants.api.tenant_router import router as tenant_router
from app.modules.projects.api.project_router import router as project_router
from app.modules.gateways.api.gateway_router import router as gateway_router
from app.modules.devices.api.device_router import router as device_router
from app.modules.sensors.api.sensor_router import router as sensor_router
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