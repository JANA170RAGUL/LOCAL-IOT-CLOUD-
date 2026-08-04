from typing import List
from app.modules.analytics.repositories.analytics_repository import AnalyticsRepository
from app.modules.analytics.schemas.analytics import (
    PlatformOverview,
    LiveStatus,
    AlertAnalytics,
    RuleAnalyticsItem,
    SensorActivityItem,
    TelemetryTrend
)

class AnalyticsService:
    def __init__(self, repository: AnalyticsRepository):
        self.repository = repository

    def get_platform_overview(self) -> PlatformOverview:
        data = self.repository.get_overview_counts()
        return PlatformOverview(**data)

    def get_live_status(self) -> LiveStatus:
        data = self.repository.get_live_status()
        return LiveStatus(**data)

    def get_alert_analytics(self) -> AlertAnalytics:
        data = self.repository.get_alert_analytics()
        return AlertAnalytics(**data)

    def get_rule_analytics(self) -> List[RuleAnalyticsItem]:
        data = self.repository.get_rule_analytics()
        return [RuleAnalyticsItem(**item) for item in data]

    def get_sensor_activity(self) -> List[SensorActivityItem]:
        data = self.repository.get_sensor_activity()
        return [SensorActivityItem(**item) for item in data]

    def get_telemetry_trends(self) -> TelemetryTrend:
        data = self.repository.get_telemetry_trends()
        return TelemetryTrend(**data)
