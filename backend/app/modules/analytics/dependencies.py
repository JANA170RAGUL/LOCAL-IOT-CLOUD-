from fastapi import Depends
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.database.influx import get_influx_client
from influxdb_client import InfluxDBClient

from app.modules.analytics.repositories.analytics_repository import AnalyticsRepository
from app.modules.analytics.services.analytics_service import AnalyticsService

def get_analytics_repository(
    db: Session = Depends(get_db),
    influx_client: InfluxDBClient = Depends(get_influx_client)
) -> AnalyticsRepository:
    return AnalyticsRepository(db=db, influx_client=influx_client)

def get_analytics_service(
    repository: AnalyticsRepository = Depends(get_analytics_repository)
) -> AnalyticsService:
    return AnalyticsService(repository=repository)
