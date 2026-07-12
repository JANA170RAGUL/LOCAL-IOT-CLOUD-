"""
app/modules/alerts/services/alert_service.py

Alert business service layer.
"""

from datetime import datetime, timezone
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.shared.services.base_service import BaseService
from app.modules.projects.models.project import Project
from app.shared.exceptions.project import ProjectNotFound
from app.shared.exceptions.alert import AlertNotFound
from app.modules.alerts.models.alert import Alert
from app.modules.alerts.repositories.alert_repository import AlertRepository
from app.modules.alerts.schemas.alert import (
    AlertCreate,
    AlertUpdate,
    AlertFilter,
)


class AlertService(BaseService[Alert, AlertRepository]):

    def __init__(self, repository: AlertRepository):
        super().__init__(repository)
        self.repository = repository

    def create_alert(
        self,
        db: Session,
        schema: AlertCreate,
    ) -> Alert:
        """Create a new alert record (typically triggered by the Rule Engine)."""
        alert = Alert(
            rule_id=schema.rule_id,
            sensor_id=schema.sensor_id,
            device_id=schema.device_id,
            severity=schema.severity,
            title=schema.title,
            message=schema.message,
            status=schema.status,
            acknowledged=schema.acknowledged,
            acknowledged_by=schema.acknowledged_by,
            acknowledged_at=schema.acknowledged_at,
            resolved=schema.resolved,
            resolved_at=schema.resolved_at,
            metadata_json=schema.metadata_json,
            is_active=True,
        )
        return self.repository.create(db, alert)

    def get_alert(self, db: Session, alert_id: str) -> Alert:
        """Fetch alert details. Raises AlertNotFound if missing or inactive."""
        alert = self.repository.get_by_id(db, alert_id)
        if not alert or not alert.is_active:
            raise AlertNotFound()
        return alert

    def list_alerts(
        self,
        db: Session,
        project_id: str,
        filters: AlertFilter,
        page: int,
        page_size: int,
    ) -> tuple[int, list[Alert]]:
        """List alerts scoped to a project with optional filters and search."""
        project = db.scalar(select(Project).where(Project.id == project_id))
        if not project or not project.is_active:
            raise ProjectNotFound()

        return self.repository.list_by_project(db, project_id, filters, page, page_size)

    def update_alert(
        self,
        db: Session,
        alert_id: str,
        schema: AlertUpdate,
    ) -> Alert:
        """Update alert attributes."""
        alert = self.get_alert(db, alert_id)

        update_data = schema.model_dump(exclude_unset=True)
        for key, val in update_data.items():
            if key == "metadata":
                alert.metadata_json = val
            elif key == "is_active":
                alert.is_active = val
            else:
                setattr(alert, key, val)

        return self.repository.update(db, alert)

    def acknowledge_alert(
        self,
        db: Session,
        alert_id: str,
        acknowledged_by: str,
    ) -> Alert:
        """Acknowledge an alert, tracking operator identity and timestamp."""
        alert = self.get_alert(db, alert_id)

        alert.acknowledged = True
        alert.acknowledged_by = acknowledged_by
        alert.acknowledged_at = datetime.now(timezone.utc)
        
        # Advance status if in OPEN state
        if alert.status == "OPEN":
            alert.status = "ACKNOWLEDGED"

        return self.repository.update(db, alert)

    def resolve_alert(
        self,
        db: Session,
        alert_id: str,
    ) -> Alert:
        """Resolve an alert, closing it out and tracking timestamp."""
        alert = self.get_alert(db, alert_id)

        alert.resolved = True
        alert.resolved_at = datetime.now(timezone.utc)
        alert.status = "RESOLVED"

        return self.repository.update(db, alert)

    def deactivate_alert(self, db: Session, alert_id: str) -> None:
        """Soft-deletes the alert by setting is_active=False and status=CLOSED."""
        alert = self.get_alert(db, alert_id)
        alert.status = "CLOSED"
        alert.is_active = False
        self.repository.update(db, alert)
