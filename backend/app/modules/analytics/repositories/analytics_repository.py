from sqlalchemy.orm import Session
from sqlalchemy import func
from influxdb_client import InfluxDBClient
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

from app.modules.users.models.user import User

class AnalyticsRepository:
    def __init__(self, db: Session, influx_client: InfluxDBClient):
        self.db = db
        self.influx_client = influx_client
        self.query_api = influx_client.query_api()

    def get_overview_counts(self) -> Dict[str, int]:
        return {
            "organizations": self.db.query(func.count(Organization.id)).scalar() or 0,
            "tenants": self.db.query(func.count(Tenant.id)).scalar() or 0,
            "users": self.db.query(func.count(User.id)).scalar() or 0,
            "projects": self.db.query(func.count(Project.id)).scalar() or 0,
            "gateways": self.db.query(func.count(Gateway.id)).scalar() or 0,
            "devices": self.db.query(func.count(Device.id)).scalar() or 0,
            "sensors": self.db.query(func.count(Sensor.id)).scalar() or 0,
        }

    def get_live_status(self) -> Dict[str, int]:
        online_gateways = self.db.query(func.count(Gateway.id)).filter(Gateway.status == "ACTIVE").scalar() or 0
        total_gateways = self.db.query(func.count(Gateway.id)).scalar() or 0
        
        online_devices = self.db.query(func.count(Device.id)).filter(Device.status == "ACTIVE").scalar() or 0
        total_devices = self.db.query(func.count(Device.id)).scalar() or 0
        
        return {
            "online_gateways": online_gateways,
            "offline_gateways": total_gateways - online_gateways,
            "online_devices": online_devices,
            "offline_devices": total_devices - online_devices,
        }

    def get_alert_analytics(self) -> Dict[str, int]:
        alerts = self.db.query(Alert.status, func.count(Alert.id)).group_by(Alert.status).all()
        severities = self.db.query(Alert.severity, func.count(Alert.id)).group_by(Alert.severity).all()
        
        status_map = {status: count for status, count in alerts}
        severity_map = {severity: count for severity, count in severities}
        
        return {
            "open": status_map.get("OPEN", 0),
            "acknowledged": status_map.get("ACKNOWLEDGED", 0),
            "resolved": status_map.get("RESOLVED", 0),
            "critical": severity_map.get("CRITICAL", 0),
            "warning": severity_map.get("WARNING", 0),
        }

    def get_rule_analytics(self) -> List[Dict[str, Any]]:
        # Count alerts per rule to determine which rules trigger the most
        results = (
            self.db.query(Rule.name, func.count(Alert.id))
            .join(Alert, Rule.id == Alert.rule_id)
            .group_by(Rule.name)
            .order_by(func.count(Alert.id).desc())
            .limit(10)
            .all()
        )
        return [{"rule": name, "count": count} for name, count in results]

    def get_sensor_activity(self) -> List[Dict[str, Any]]:
        # Aggregate readings by sensor_type from InfluxDB
        query = f'''
        from(bucket: "{settings.influx_bucket}")
          |> range(start: -30d)
          |> group(columns: ["_measurement"])
          |> count(column: "_value")
        '''
        try:
            tables = self.query_api.query(query, org=settings.influx_org)
            results = []
            for table in tables:
                for record in table.records:
                    results.append({
                        "sensor": record.get_measurement(),
                        "readings": record.get_value()
                    })
            return sorted(results, key=lambda x: x["readings"], reverse=True)
        except Exception:
            return []

    def get_telemetry_trends(self) -> Dict[str, Any]:
        # Count total telemetry points for different time ranges
        def count_range(start: str) -> int:
            query = f'''
            from(bucket: "{settings.influx_bucket}")
              |> range(start: {start})
              |> count(column: "_value")
              |> group()
              |> sum(column: "_value")
            '''
            try:
                tables = self.query_api.query(query, org=settings.influx_org)
                for table in tables:
                    for record in table.records:
                        return record.get_value()
                return 0
            except Exception:
                return 0

        # Get device trend line chart data (e.g. daily counts for the last 7 days)
        chart_query = f'''
        from(bucket: "{settings.influx_bucket}")
          |> range(start: -7d)
          |> aggregateWindow(every: 1d, fn: count, createEmpty: true)
          |> group()
          |> sum(column: "_value")
        '''
        chart_data = []
        try:
            # Wait, aggregateWindow with sum across series needs careful grouping.
            # We want total points per day.
            chart_query = f'''
            from(bucket: "{settings.influx_bucket}")
              |> range(start: -7d)
              |> group()
              |> aggregateWindow(every: 1d, fn: count, createEmpty: true)
            '''
            tables = self.query_api.query(chart_query, org=settings.influx_org)
            for table in tables:
                for record in table.records:
                    time_str = record.get_time().strftime("%Y-%m-%d")
                    val = record.get_value() or 0
                    chart_data.append({"time": time_str, "value": val})
        except Exception:
            pass

        return {
            "today": count_range("-1d"),
            "yesterday": count_range("-2d") - count_range("-1d"),  # Roughly
            "week": count_range("-7d"),
            "month": count_range("-30d"),
            "chart_data": chart_data
        }
