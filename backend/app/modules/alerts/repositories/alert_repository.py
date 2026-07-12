"""
app/modules/alerts/repositories/alert_repository.py

Alert repository layer.
"""

from sqlalchemy import select, and_, or_, func
from sqlalchemy.orm import Session

from app.shared.repositories.base_repository import BaseRepository
from app.modules.alerts.models.alert import Alert
from app.modules.alerts.schemas.alert import AlertFilter
from app.modules.rules.models.rule import Rule
from app.modules.sensors.models.sensor import Sensor
from app.modules.devices.models.device import Device
from app.modules.gateways.models.gateway import Gateway


class AlertRepository(BaseRepository[Alert]):

    def __init__(self):
        super().__init__(Alert)

    def list_by_project(
        self,
        db: Session,
        project_id: str,
        filters: AlertFilter,
        page: int,
        page_size: int,
    ) -> tuple[int, list[Alert]]:
        """
        List alerts for a project with optional filters and pagination.
        Alerts are joined to the project through Rule or Sensor/Device/Gateway parents.
        """
        # Base query joining Alert to Rule or Sensor -> Device -> Gateway to determine project scoping
        stmt = select(Alert).outerjoin(Rule, Alert.rule_id == Rule.id).outerjoin(Sensor, Alert.sensor_id == Sensor.id).outerjoin(Device, Sensor.device_id == Device.id).outerjoin(Gateway, Device.gateway_id == Gateway.id)

        # Scoped to project_id via either the rule's project_id or the gateway's project_id
        stmt = stmt.where(
            or_(
                Rule.project_id == project_id,
                Gateway.project_id == project_id
            )
        )

        # Apply filters
        if filters.status:
            stmt = stmt.where(Alert.status == filters.status)
        if filters.severity:
            stmt = stmt.where(Alert.severity == filters.severity)
        if filters.acknowledged is not None:
            stmt = stmt.where(Alert.acknowledged == filters.acknowledged)
        if filters.resolved is not None:
            stmt = stmt.where(Alert.resolved == filters.resolved)

        if filters.search:
            search_clause = f"%{filters.search}%"
            stmt = stmt.where(
                or_(
                    Alert.title.ilike(search_clause),
                    Alert.message.ilike(search_clause),
                )
            )

        # Count total
        count_stmt = select(func.count()).select_from(stmt.subquery())
        total = db.scalar(count_stmt) or 0

        # Offset and limit
        offset = (page - 1) * page_size
        stmt = stmt.offset(offset).limit(page_size)

        items = list(db.scalars(stmt).all())
        return total, items
