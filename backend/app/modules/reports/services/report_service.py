from typing import List, Dict, Any
from fastapi import HTTPException
from app.modules.reports.repositories.report_repository import ReportRepository
from app.modules.reports.schemas.report import ReportFilter, ReportRequest
from app.modules.reports.generators.pdf_generator import generate_pdf
from app.modules.reports.generators.excel_generator import generate_excel
from app.modules.reports.generators.csv_generator import generate_csv

class ReportService:
    def __init__(self, repository: ReportRepository):
        self.repository = repository

    def get_report_data(self, report_type: str, filters: ReportFilter) -> List[Dict[str, Any]]:
        if report_type == "devices":
            return self.repository.get_devices(filters)
        elif report_type == "gateways":
            return self.repository.get_gateways(filters)
        elif report_type == "alerts":
            return self.repository.get_alerts(filters)
        elif report_type == "rules":
            return self.repository.get_rules(filters)
        elif report_type == "telemetry":
            return self.repository.get_telemetry(filters)
        elif report_type == "dashboard":
            return [self.repository.get_dashboard_snapshot(filters)]
        else:
            raise HTTPException(status_code=400, detail=f"Invalid report_type: {report_type}")

    def generate_report(self, request: ReportRequest) -> bytes:
        data = self.get_report_data(request.report_type, request.filters)
        title = f"{request.report_type.capitalize()} Report"
        
        if request.format == "pdf":
            return generate_pdf(data, title)
        elif request.format == "excel":
            return generate_excel(data, title)
        elif request.format == "csv":
            return generate_csv(data)
        else:
            raise HTTPException(status_code=400, detail=f"Invalid format: {request.format}")
