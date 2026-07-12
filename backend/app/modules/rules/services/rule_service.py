"""
app/modules/rules/services/rule_service.py

Rule business service layer.
"""

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.shared.services.base_service import BaseService
from app.modules.projects.models.project import Project
from app.modules.sensors.models.sensor import Sensor
from app.shared.exceptions.project import ProjectNotFound
from app.shared.exceptions.sensor import SensorNotFound
from app.shared.exceptions.rule import RuleNotFound, RuleCodeConflict
from app.modules.rules.models.rule import Rule
from app.modules.rules.repositories.rule_repository import RuleRepository
from app.modules.rules.schemas.rule import (
    RuleCreate,
    RuleUpdate,
    RuleFilter,
)


class RuleService(BaseService[Rule, RuleRepository]):

    def __init__(self, repository: RuleRepository):
        super().__init__(repository)
        self.repository = repository

    def create_rule(
        self,
        db: Session,
        project_id: str,
        schema: RuleCreate,
    ) -> Rule:
        """Create a new automation rule under an active project."""
        # 1. Verify project exists and is active
        project = db.scalar(select(Project).where(Project.id == project_id))
        if not project or not project.is_active:
            raise ProjectNotFound()

        # 2. Verify sensor exists and is active
        sensor = db.scalar(select(Sensor).where(Sensor.id == schema.sensor_id))
        if not sensor or not sensor.is_active:
            raise SensorNotFound()

        # 3. Check for code conflict inside this project
        if self.repository.exists_by_code(db, project_id, schema.code):
            raise RuleCodeConflict()

        # 4. Instantiate model
        rule = Rule(
            project_id=project_id,
            code=schema.code,
            name=schema.name,
            description=schema.description,
            sensor_id=schema.sensor_id,
            condition=schema.condition,
            threshold=schema.threshold,
            severity=schema.severity,
            enabled=schema.enabled,
            cooldown_seconds=schema.cooldown_seconds,
            action_type=schema.action_type,
            action_config=schema.action_config,
            status="ACTIVE",
            is_active=True,
        )

        return self.repository.create(db, rule)

    def get_rule(self, db: Session, rule_id: str) -> Rule:
        """Fetch rule details. Raises RuleNotFound if missing or inactive."""
        rule = self.repository.get_by_id(db, rule_id)
        if not rule or not rule.is_active:
            raise RuleNotFound()
        return rule

    def list_rules(
        self,
        db: Session,
        project_id: str,
        filters: RuleFilter,
        page: int,
        page_size: int,
    ) -> tuple[int, list[Rule]]:
        """List rules for a project with filters."""
        project = db.scalar(select(Project).where(Project.id == project_id))
        if not project or not project.is_active:
            raise ProjectNotFound()

        return self.repository.list_by_project(db, project_id, filters, page, page_size)

    def update_rule(
        self,
        db: Session,
        rule_id: str,
        schema: RuleUpdate,
    ) -> Rule:
        """Update rule attributes."""
        rule = self.get_rule(db, rule_id)

        # If sensor_id is updated, verify it exists and is active
        if schema.sensor_id is not None:
            sensor = db.scalar(select(Sensor).where(Sensor.id == schema.sensor_id))
            if not sensor or not sensor.is_active:
                raise SensorNotFound()

        # Update fields
        update_data = schema.model_dump(exclude_unset=True)
        for key, val in update_data.items():
            setattr(rule, key, val)

        # Check soft deactivation if status set to INACTIVE
        if schema.status == "INACTIVE":
            rule.is_active = False

        return self.repository.update(db, rule)

    def deactivate_rule(self, db: Session, rule_id: str) -> None:
        """Soft-deactivates the rule."""
        rule = self.get_rule(db, rule_id)
        rule.status = "INACTIVE"
        rule.is_active = False
        self.repository.update(db, rule)
