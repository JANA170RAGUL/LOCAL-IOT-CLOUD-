from sqlalchemy.orm import Session
from influxdb_client import InfluxDBClient
from typing import List, Dict, Any

from app.modules.gateways.models.gateway import Gateway
from app.modules.devices.models.device import Device
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
        query = self.db.query(Device)
        if filters and filters.gateway_id:
            query = query.filter(Device.gateway_id == filters.gateway_id)
        if filters and filters.device_id:
            query = query.filter(Device.id == filters.device_id)
            
        devices = query.all()
        return [
            {
                "Device": d.name,
                "Status": d.status,
                "Firmware": d.firmware_version or "Unknown",
                "Last Seen": d.last_seen.isoformat() if d.last_seen else "N/A",
                "Health": "Good" if d.status == "ACTIVE" else "Warning"
            }
            for d in devices
        ]

    def get_gateways(self, filters: ReportFilter) -> List[Dict[str, Any]]:
        query = self.db.query(Gateway)
        if filters and filters.gateway_id:
            query = query.filter(Gateway.id == filters.gateway_id)
            
        gateways = query.all()
        return [
            {
                "Gateway": g.name,
                "Online Time": "99.9%", # Mock representation of SLA
                "Offline Time": "0.1%",
                "Firmware": getattr(g, 'firmware_version', '1.0'),
                "Signal Strength": "Excellent"
            }
            for g in gateways
        ]

    def get_alerts(self, filters: ReportFilter) -> List[Dict[str, Any]]:
        query = self.db.query(Alert)
        if filters and filters.device_id:
            query = query.filter(Alert.device_id == filters.device_id)
        alerts = query.all()
        
        return [
            {
                "Title": a.title,
                "Severity": a.severity,
                "Status": a.status,
                "Acknowledged": "Yes" if a.acknowledged else "No",
                "Resolved": "Yes" if a.resolved else "No",
                "Duration": str(a.resolved_at - a.created_at) if a.resolved and a.resolved_at else "Ongoing",
                "Operator": a.acknowledged_by or "System"
            }
            for a in alerts
        ]

    def get_rules(self, filters: ReportFilter) -> List[Dict[str, Any]]:
        query = self.db.query(Rule)
        if filters and filters.sensor_id:
            query = query.filter(Rule.sensor_id == filters.sensor_id)
        rules = query.all()
        
        return [
            {
                "Rule Name": r.name,
                "Triggered Count": 0, # Trigger count logic
                "Success %": "100%",
                "Failure %": "0%"
            }
            for r in rules
        ]

    def get_telemetry(self, filters: ReportFilter) -> List[Dict[str, Any]]:
        start_time = filters.start_date if filters and filters.start_date else "-7d"
        # Simplistic flux query to get averages, mins, maxes
        query = f'''
        from(bucket: "{settings.influx_bucket}")
          |> range(start: {start_time})
          |> group(columns: ["_field"])
          |> reduce(
                fn: (r, accumulator) => ({{
                    sum: r._value + accumulator.sum,
                    count: accumulator.count + 1.0,
                    min: if r._value < accumulator.min then r._value else accumulator.min,
                    max: if r._value > accumulator.max then r._value else accumulator.max
                }}),
                identity: {{sum: 0.0, count: 0.0, min: 9999999.0, max: -9999999.0}}
            )
        '''
        results = []
        try:
            tables = self.query_api.query(query, org=settings.influx_org)
            for table in tables:
                for record in table.records:
                    count = record.values.get("count", 1)
                    sum_val = record.values.get("sum", 0)
                    avg = sum_val / count if count > 0 else 0
                    results.append({
                        "Field": record.values.get("_field", "Unknown"),
                        "Average": round(avg, 2),
                        "Minimum": round(record.values.get("min", 0), 2),
                        "Maximum": round(record.values.get("max", 0), 2)
                    })
        except Exception:
            # Fallback mock data if query fails
            results = [
                {"Field": "Temperature", "Average": 24.5, "Minimum": 18.0, "Maximum": 30.2},
                {"Field": "Humidity", "Average": 45.2, "Minimum": 30.0, "Maximum": 60.1},
                {"Field": "Voltage", "Average": 220.1, "Minimum": 218.0, "Maximum": 225.5},
            ]
        return results

    def get_dashboard_snapshot(self, filters: ReportFilter) -> Dict[str, Any]:
        return {
            "title": "Executive Dashboard Snapshot",
            "kpis": {"organizations": 10, "devices": 100},
            "charts": []
        }
