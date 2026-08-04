from fastapi import APIRouter, Depends
from typing import List

from app.modules.analytics.schemas.analytics import (
    PlatformOverview,
    LiveStatus,
    AlertAnalytics,
    RuleAnalyticsItem,
    SensorActivityItem,
    TelemetryTrend
)
from app.modules.analytics.services.analytics_service import AnalyticsService
from app.modules.analytics.dependencies import get_analytics_service
from app.modules.licensing.dependencies import require_feature

router = APIRouter(
    prefix="/analytics", 
    tags=["Analytics"]
)

@router.get("/overview", response_model=PlatformOverview)
def get_overview(service: AnalyticsService = Depends(get_analytics_service)):
    return service.get_platform_overview()

@router.get("/live-status", response_model=LiveStatus)
def get_live_status(service: AnalyticsService = Depends(get_analytics_service)):
    return service.get_live_status()

@router.get("/alerts", response_model=AlertAnalytics, dependencies=[Depends(require_feature("analytics"))])
def get_alert_analytics(service: AnalyticsService = Depends(get_analytics_service)):
    return service.get_alert_analytics()

@router.get("/rules", response_model=List[RuleAnalyticsItem], dependencies=[Depends(require_feature("analytics"))])
def get_rule_analytics(service: AnalyticsService = Depends(get_analytics_service)):
    return service.get_rule_analytics()

@router.get("/sensors", response_model=List[SensorActivityItem], dependencies=[Depends(require_feature("analytics"))])
def get_sensor_activity(service: AnalyticsService = Depends(get_analytics_service)):
    return service.get_sensor_activity()

@router.get("/trends", response_model=TelemetryTrend, dependencies=[Depends(require_feature("analytics"))])
def get_telemetry_trends(service: AnalyticsService = Depends(get_analytics_service)):
    return service.get_telemetry_trends()
