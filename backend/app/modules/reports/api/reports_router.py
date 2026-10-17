from fastapi import APIRouter, Depends
from fastapi.responses import Response
from typing import List, Dict, Any

import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.mime.application import MIMEApplication
from app.modules.settings.services.settings_service import SettingsService
from app.database.session import SessionLocal

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
    email_to:str| None = None,
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

    if email_to:
        try:
            with SessionLocal() as db:
                settings_svc = SettingsService(db)
                email_cfg = settings_svc.get_category_settings("email")

                if email_cfg and email_cfg.get("smtpHost"):
                    msg = MIMEMultipart()
                    msg["From"] = email_cfg.get("senderEmail","noreply@localiot.com")
                    msg["To"] = email_to
                    msg["subject"] = f"LocalIoTCloud - {request.report_type.capitalize()} Report ({format.upper()})"

                    body = f"Hello,\n\nPlease find attached your generated {request.report_type.capitalize()} report ({format.upper()}).\n\nBest regards,\nLocalIoTCloud Platform"
                    msg.attach(MIMEText(body, 'plain'))
                    
                    filename = f"{request.report_type}_report.{extensions.get(format, 'bin')}"
                    part = MIMEApplication(file_bytes, Name=filename)
                    part['Content-Disposition'] = f'attachment; filename="{filename}"'
                    msg.attach(part)
                    
                    server = smtplib.SMTP(email_cfg.get("smtpHost"), int(email_cfg.get("smtpPort", 587)), timeout=15)
                    server.starttls()
                    if email_cfg.get("username") and email_cfg.get("password"):
                        server.login(email_cfg.get("username"), email_cfg.get("password"))
                    server.send_message(msg)
                    server.quit()
        except Exception as err:
            raise HTTPException(status_code=500, detail=f"Failed to email report: {str(err)}")
    
    
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
