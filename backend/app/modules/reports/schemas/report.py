from pydantic import BaseModel, Field
from typing import Optional

class ReportFilter(BaseModel):
    organization_id: Optional[str] = None
    tenant_id: Optional[str] = None
    project_id: Optional[str] = None
    gateway_id: Optional[str] = None
    device_id: Optional[str] = None
    sensor_id: Optional[str] = None
    start_date: Optional[str] = None
    end_date: Optional[str] = None

class ReportRequest(BaseModel):
    report_type: str = Field(..., description="devices, telemetry, alerts, rules, gateways, or dashboard")
    format: str = Field("pdf", description="pdf, excel, or csv")
    filters: Optional[ReportFilter] = None
