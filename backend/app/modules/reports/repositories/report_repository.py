from sqlalchemy.orm import Session
from influxdb_client import InfluxDBClient  # type: ignore
from typing import List, Dict, Any

from app.modules.organizations.models.organization import Organization
from app.modules.tenants.models.tenant import Tenant
from app.modules.projects.models.project import Project
from app.modules.gateways.models.gateway import Gateway
from app.modules.devices.models.device import Device
from app.modules.sensors.models.sensor import Sensor
from app.modules.alerts.models.alert import Alert
from app.modules.rules.models.rule import Rule
from app.config.settings import settings
from app.modules.reports.schemas.report import ReportFilter


class ReportRepository:
    def __init__(self, db: Session, influx_client: InfluxDBClient):
        self.db = db
        self.influx_client = influx_client
        self.query_api = influx_client.query_api()

    def get_devices(self, filters: ReportFilter) -> List[Dict[str, Any]]:
        query = self.db.query(Device).join(Gateway).join(Project).join(Tenant).join(Organization)
        if filters:
            if filters.device_id:
                query = query.filter(Device.id == filters.device_id)
            elif filters.gateway_id:
                query = query.filter(Device.gateway_id == filters.gateway_id)
            elif filters.project_id:
                query = query.filter(Gateway.project_id == filters.project_id)
            elif filters.tenant_id:
                query = query.filter(Project.tenant_id == filters.tenant_id)
            elif filters.organization_id:
                query = query.filter(Tenant.organization_id == filters.organization_id)
            
        devices = query.all()
        return [
            {
                "Organization": d.gateway.project.tenant.organization.name if (d.gateway and d.gateway.project and d.gateway.project.tenant and d.gateway.project.tenant.organization) else "N/A",
                "Tenant": d.gateway.project.tenant.name if (d.gateway and d.gateway.project and d.gateway.project.tenant) else "N/A",
                "Project": d.gateway.project.name if (d.gateway and d.gateway.project) else "N/A",
                "Gateway": d.gateway.name if d.gateway else "N/A",
                "Device Code": d.code,
                "Device Name": d.name,
                "Device Type": d.device_type or "General",
                "Status": d.status,
                "Firmware": d.firmware_version or "1.0",
                "IP Address": d.ip_address or "N/A",
                "Last Seen": d.last_seen.strftime('%Y-%m-%d %H:%M:%S') if d.last_seen else "N/A",
                "Health": "Good" if d.status == "ACTIVE" else "Warning"
            }
            for d in devices
        ]

    def get_gateways(self, filters: ReportFilter) -> List[Dict[str, Any]]:
        query = self.db.query(Gateway).join(Project).join(Tenant).join(Organization)
        if filters:
            if filters.gateway_id:
                query = query.filter(Gateway.id == filters.gateway_id)
            elif filters.project_id:
                query = query.filter(Gateway.project_id == filters.project_id)
            elif filters.tenant_id:
                query = query.filter(Project.tenant_id == filters.tenant_id)
            elif filters.organization_id:
                query = query.filter(Tenant.organization_id == filters.organization_id)
            
        gateways = query.all()
        return [
            {
                "Organization": g.project.tenant.organization.name if (g.project and g.project.tenant and g.project.tenant.organization) else "N/A",
                "Tenant": g.project.tenant.name if (g.project and g.project.tenant) else "N/A",
                "Project": g.project.name if g.project else "N/A",
                "Gateway Code": g.code,
                "Gateway Name": g.name,
                "Protocol": g.protocol or "MQTT",
                "Status": g.status,
                "Location": g.location or "N/A",
                "Firmware": g.firmware_version or "1.0",
                "Last Seen": g.last_seen.strftime('%Y-%m-%d %H:%M:%S') if g.last_seen else "N/A"
            }
            for g in gateways
        ]

    def get_alerts(self, filters: ReportFilter) -> List[Dict[str, Any]]:
        query = self.db.query(Alert).join(Device).join(Gateway).join(Project).join(Tenant).join(Organization)
        if filters:
            if filters.device_id:
                query = query.filter(Alert.device_id == filters.device_id)
            elif filters.gateway_id:
                query = query.filter(Device.gateway_id == filters.gateway_id)
            elif filters.project_id:
                query = query.filter(Gateway.project_id == filters.project_id)
            elif filters.tenant_id:
                query = query.filter(Project.tenant_id == filters.tenant_id)
            elif filters.organization_id:
                query = query.filter(Tenant.organization_id == filters.organization_id)

        alerts = query.all()
        
        return [
            {
                "Organization": a.device.gateway.project.tenant.organization.name if (a.device and a.device.gateway and a.device.gateway.project and a.device.gateway.project.tenant and a.device.gateway.project.tenant.organization) else "N/A",
                "Tenant": a.device.gateway.project.tenant.name if (a.device and a.device.gateway and a.device.gateway.project and a.device.gateway.project.tenant) else "N/A",
                "Project": a.device.gateway.project.name if (a.device and a.device.gateway and a.device.gateway.project) else "N/A",
                "Gateway": a.device.gateway.name if (a.device and a.device.gateway) else "N/A",
                "Device": a.device.name if a.device else "N/A",
                "Alert Code": getattr(a, "code", a.id),
                "Alert Name": a.title,
                "Severity": a.severity,
                "Status": a.status,
                "Acknowledged": "Yes" if a.acknowledged else "No",
                "Resolved": "Yes" if a.resolved else "No",
                "Created At": a.created_at.strftime('%Y-%m-%d %H:%M:%S') if a.created_at else "N/A",
                "Operator": a.acknowledged_by or "System"
            }
            for a in alerts
        ]

    def get_rules(self, filters: ReportFilter) -> List[Dict[str, Any]]:
        query = self.db.query(Rule).outerjoin(Project).outerjoin(Tenant).outerjoin(Organization)
        if filters:
            if filters.sensor_id:
                query = query.filter(Rule.sensor_id == filters.sensor_id)
            elif filters.device_id:
                query = query.join(Sensor).filter(Sensor.device_id == filters.device_id)
            elif filters.gateway_id:
                query = query.join(Sensor).join(Device).filter(Device.gateway_id == filters.gateway_id)
            elif filters.project_id:
                query = query.filter(Rule.project_id == filters.project_id)
            elif filters.tenant_id:
                query = query.filter(Project.tenant_id == filters.tenant_id)
            elif filters.organization_id:
                query = query.filter(Tenant.organization_id == filters.organization_id)

        rules = query.all()
        
        return [
            {
                "Organization": r.project.tenant.organization.name if (r.project and r.project.tenant and r.project.tenant.organization) else (r.sensor.device.gateway.project.tenant.organization.name if (r.sensor and r.sensor.device and r.sensor.device.gateway and r.sensor.device.gateway.project and r.sensor.device.gateway.project.tenant and r.sensor.device.gateway.project.tenant.organization) else "N/A"),
                "Tenant": r.project.tenant.name if (r.project and r.project.tenant) else (r.sensor.device.gateway.project.tenant.name if (r.sensor and r.sensor.device and r.sensor.device.gateway and r.sensor.device.gateway.project and r.sensor.device.gateway.project.tenant) else "N/A"),
                "Project": r.project.name if r.project else (r.sensor.device.gateway.project.name if (r.sensor and r.sensor.device and r.sensor.device.gateway and r.sensor.device.gateway.project) else "N/A"),
                "Gateway": r.sensor.device.gateway.name if (r.sensor and r.sensor.device and r.sensor.device.gateway) else "N/A",
                "Device": r.sensor.device.name if (r.sensor and r.sensor.device) else "N/A",
                "Sensor": r.sensor.name if r.sensor else "N/A",
                "Rule Code": r.code,
                "Rule Name": r.name,
                "Condition": f"{r.condition} {r.threshold}",
                "Severity": r.severity,
                "Status": "Enabled" if r.enabled else "Disabled",
                "Action Type": r.action_type
            }
            for r in rules
        ]

    def get_telemetry(self, filters: ReportFilter) -> List[Dict[str, Any]]:
        query = self.db.query(Sensor).join(Device).join(Gateway).join(Project).join(Tenant).join(Organization)
        if filters:
            if filters.sensor_id:
                query = query.filter(Sensor.id == filters.sensor_id)
            elif filters.device_id:
                query = query.filter(Sensor.device_id == filters.device_id)
            elif filters.gateway_id:
                query = query.filter(Device.gateway_id == filters.gateway_id)
            elif filters.project_id:
                query = query.filter(Gateway.project_id == filters.project_id)
            elif filters.tenant_id:
                query = query.filter(Project.tenant_id == filters.tenant_id)
            elif filters.organization_id:
                query = query.filter(Tenant.organization_id == filters.organization_id)

        sensors = query.all()
        return [
            {
                "Organization": s.device.gateway.project.tenant.organization.name if (s.device and s.device.gateway and s.device.gateway.project and s.device.gateway.project.tenant and s.device.gateway.project.tenant.organization) else "N/A",
                "Tenant": s.device.gateway.project.tenant.name if (s.device and s.device.gateway and s.device.gateway.project and s.device.gateway.project.tenant) else "N/A",
                "Project": s.device.gateway.project.name if (s.device and s.device.gateway and s.device.gateway.project) else "N/A",
                "Gateway": s.device.gateway.name if (s.device and s.device.gateway) else "N/A",
                "Device": s.device.name if s.device else "N/A",
                "Sensor Code": s.code,
                "Sensor Name": s.name,
                "Sensor Type": s.sensor_type,
                "Unit": s.unit or "",
                "Min Boundary": s.min_value if s.min_value is not None else "N/A",
                "Max Boundary": s.max_value if s.max_value is not None else "N/A",
                "Status": s.status,
                "Last Reading At": s.last_reading_at.strftime('%Y-%m-%d %H:%M:%S') if s.last_reading_at else "N/A"
            }
            for s in sensors
        ]

    def get_dashboard_snapshot(self, filters: ReportFilter) -> List[Dict[str, Any]]:
        devices = self.get_devices(filters)
        gateways = self.get_gateways(filters)
        alerts = self.get_alerts(filters)
        rules = self.get_rules(filters)
        
        return [
            {
                "Scope Summary": "Executive Assets Snapshot",
                "Total Devices": len(devices),
                "Active Devices": sum(1 for d in devices if d.get("Status") == "ACTIVE"),
                "Total Gateways": len(gateways),
                "Online Gateways": sum(1 for g in gateways if g.get("Status") == "ACTIVE"),
                "Total Active Alerts": len(alerts),
                "Total Automation Rules": len(rules)
            }
        ]
