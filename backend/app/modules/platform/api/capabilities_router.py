"""
app/modules/platform/api/capabilities_router.py

Platform capabilities endpoint for LocalIoTCloud.
Distinguishes between licensed features and active configuration state.
"""

from typing import Dict, Any
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.config.settings import settings
from app.database.session import get_db
from app.modules.ai_engine.providers import get_ai_provider
from app.modules.licensing.services.license_policy import LicensePolicyService
from app.modules.licensing.features import LicenseFeature

router = APIRouter(prefix="/platform", tags=["Platform Capabilities"])


@router.get("/capabilities")
def get_platform_capabilities(db: Session = Depends(get_db)) -> Dict[str, Any]:
    """Returns platform feature entitlement (licensed) and operational readiness (configured)."""
    policy_service = LicensePolicyService()
    try:
        snapshot = policy_service.get_snapshot(db)
        ai_licensed = snapshot.features.get(LicenseFeature.AI.value, False)
        reports_licensed = snapshot.features.get(LicenseFeature.REPORTS.value, False)
        analytics_licensed = snapshot.features.get(LicenseFeature.ANALYTICS.value, False)
    except Exception:
        ai_licensed = False
        reports_licensed = False
        analytics_licensed = False

    ai_provider = get_ai_provider()
    ai_configured = ai_provider.is_available()

    return {
        "ai": {
            "licensed": ai_licensed,
            "configured": ai_configured,
            "provider": settings.ai_provider,
        },
        "email_notifications": {
            "configured": settings.notification_provider == "smtp",
            "provider": settings.notification_provider,
        },
        "mqtt": {
            "configured": bool(settings.mqtt_host),
            "host": settings.mqtt_host,
            "tls": settings.mqtt_use_tls,
        },
        "reports": {
            "licensed": reports_licensed,
            "available": reports_licensed,
        },
        "analytics": {
            "licensed": analytics_licensed,
            "available": analytics_licensed,
        },
        "environment": {
            "app_env": settings.app_env,
            "allow_demo_data": settings.allow_demo_data,
            "allow_simulators": settings.allow_simulators,
        },
    }
