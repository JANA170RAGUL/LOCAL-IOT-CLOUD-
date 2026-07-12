"""
app/modules/rules/engine/rule_loader.py

Loads active rules from MySQL for evaluation.
"""

from sqlalchemy.orm import Session
from app.modules.rules.models.rule import Rule
from app.modules.rules.repositories.rule_repository import RuleRepository


class RuleLoader:
    
    _repo = RuleRepository()

    @classmethod
    def load_active_rules_for_sensor(cls, db: Session, sensor_id: str) -> list[Rule]:
        """Fetch all enabled and active rules for a specific sensor."""
        return cls._repo.get_active_rules_for_sensor(db, sensor_id)
