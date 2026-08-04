from fastapi import Depends
from sqlalchemy.orm import Session
from influxdb_client import InfluxDBClient
from app.database.session import get_db
from app.database.influx import get_influx_client

from app.modules.reports.repositories.report_repository import ReportRepository
from app.modules.reports.services.report_service import ReportService

def get_report_repository(
    db: Session = Depends(get_db),
    influx_client: InfluxDBClient = Depends(get_influx_client)
) -> ReportRepository:
    return ReportRepository(db=db, influx_client=influx_client)

def get_report_service(
    repository: ReportRepository = Depends(get_report_repository)
) -> ReportService:
    return ReportService(repository=repository)
