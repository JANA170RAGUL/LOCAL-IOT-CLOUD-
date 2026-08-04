from pydantic import BaseModel
from typing import List

class PlatformOverview(BaseModel):
    organizations: int
    tenants: int
    users: int
    projects: int
    gateways: int
    devices: int
    sensors: int

class LiveStatus(BaseModel):
    online_devices: int
    offline_devices: int
    online_gateways: int
    offline_gateways: int

class AlertAnalytics(BaseModel):
    open: int
    acknowledged: int
    resolved: int
    critical: int
    warning: int

class RuleAnalyticsItem(BaseModel):
    rule: str
    count: int

class SensorActivityItem(BaseModel):
    sensor: str
    readings: int

class TrendDataPoint(BaseModel):
    time: str
    value: int

class TelemetryTrend(BaseModel):
    today: int
    yesterday: int
    week: int
    month: int
    chart_data: List[TrendDataPoint] = []
