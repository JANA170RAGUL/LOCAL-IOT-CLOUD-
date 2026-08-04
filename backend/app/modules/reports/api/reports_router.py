from fastapi import APIRouter, Depends
from fastapi.responses import Response
from typing import List, Dict, Any

from app.modules.reports.schemas.report import ReportRequest, ReportFilter
from app.modules.reports.services.report_service import ReportService
from app.modules.reports.dependencies import get_report_service
from app.modules.licensing.dependencies import require_feature
from app.modules.licensing.services.feature_service import feature_service
from fastapi import HTTPException

router = APIRouter(
    prefix="/reports", 
    tags=["Reports"],
    dependencies=[Depends(require_feature("reports"))]
)

@router.post("/export/{format}")
def export_report(
    format: str,
    request: ReportRequest,
    service: ReportService = Depends(get_report_service)
):
    # Check format-specific feature limit
    format_feature = f"reports_{format}"
    if not feature_service.is_feature_enabled(format_feature) and not feature_service.is_feature_enabled("reports_all"):
        # For our specific requirement, if it's explicitly disabled or just missing and we want strict checks:
        if format_feature in feature_service.features and not feature_service.features[format_feature]:
            raise HTTPException(status_code=403, detail=f"Export format {format} is explicitly disabled by your license.")
            
    request.format = format
    file_bytes = service.generate_report(request)
    
    media_types = {
        "pdf": "application/pdf",
        "excel": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "csv": "text/csv"
    }
    
    extensions = {
        "pdf": "pdf",
        "excel": "xlsx",
        "csv": "csv"
    }
    
    headers = {
        "Content-Disposition": f"attachment; filename={request.report_type}_report.{extensions.get(format, 'bin')}"
    }
    
    return Response(
        content=file_bytes,
        media_type=media_types.get(format, "application/octet-stream"),
        headers=headers
    )

@router.get("/devices")
def get_devices_report(service: ReportService = Depends(get_report_service)):
    return service.get_report_data("devices", ReportFilter())

@router.get("/telemetry")
def get_telemetry_report(service: ReportService = Depends(get_report_service)):
    return service.get_report_data("telemetry", ReportFilter())

@router.get("/alerts")
def get_alerts_report(service: ReportService = Depends(get_report_service)):
    return service.get_report_data("alerts", ReportFilter())

@router.get("/rules")
def get_rules_report(service: ReportService = Depends(get_report_service)):
    return service.get_report_data("rules", ReportFilter())

@router.get("/gateways")
def get_gateways_report(service: ReportService = Depends(get_report_service)):
    return service.get_report_data("gateways", ReportFilter())

@router.get("/dashboard")
def get_dashboard_report(service: ReportService = Depends(get_report_service)):
    return service.get_report_data("dashboard", ReportFilter())
