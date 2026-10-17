from contextlib import asynccontextmanager
import logging

from fastapi import FastAPI, Response, status
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1.router import api_v1_router
from app.config.settings import settings
from app.core.readiness import check_mysql, check_redis, check_influx
from app.database.session import SessionLocal
from app.modules.licensing.services.license_validator import validate_active_license
from app.shared.exceptions.handlers import register_exception_handlers

from app.core.production_checks import run_production_checks

logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Validate production configuration flags first
    run_production_checks()

    # API-specific initialization only
    session = SessionLocal()
    try:
        validate_active_license(session)
        logger.info(f"API Service [{settings.service_name}] initialized successfully.")
    except Exception as e:
        logger.error(f"License validation error: {e}")
    finally:
        session.close()

    yield


app = FastAPI(
    title="Local IoT Cloud Platform",
    version="1.0.0-rc1",
    description="Self-Hosted Multi-Tenant IoT Cloud Platform",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

register_exception_handlers(app)


# ============================================================
# API v1 ROUTER REGISTRY
# ============================================================

app.include_router(
    api_v1_router,
    prefix=settings.api_v1_prefix,
)


# ============================================================
# NON-VERSIONED INFRASTRUCTURE ENDPOINTS
# ============================================================

@app.get(
    "/",
    include_in_schema=False,
)
def root():
    return {
        "name": "LocalIoTCloud",
        "version": "1.0.0-rc1",
    }


@app.get(
    "/healthz",
    include_in_schema=False,
)
def healthz():
    return {
        "status": "ok",
    }


@app.get(
    "/readyz",
    include_in_schema=False,
)
def readyz(response: Response):
    mysql_ok, _ = check_mysql()
    redis_ok, _ = check_redis()
    influx_ok, _ = check_influx()

    checks = {
        "mysql": mysql_ok,
        "redis": redis_ok,
        "influxdb": influx_ok,
    }

    ready = all(checks.values())

    if not ready:
        response.status_code = status.HTTP_503_SERVICE_UNAVAILABLE

    return {
        "status": "ready" if ready else "not_ready",
        "checks": checks,
    }

