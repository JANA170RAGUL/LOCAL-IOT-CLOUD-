from fastapi import FastAPI

from app.modules.organizations.api.organization_router import router as organization_router
from app.shared.exceptions.handlers import register_exception_handlers

app = FastAPI(
    title="Local IoT Cloud Platform",
    version="1.0.0",
    description="Self-Hosted Multi-Tenant IoT Cloud Platform",
)

register_exception_handlers(app)

# Register Routers
app.include_router(organization_router)


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