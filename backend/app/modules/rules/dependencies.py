"""
app/modules/rules/dependencies.py

FastAPI ``Depends()`` helpers scoped to the Rule module.
"""

from __future__ import annotations

from app.modules.rules.services.rule_service import RuleService
from app.modules.rules.repositories.rule_repository import RuleRepository


def get_rule_service() -> RuleService:
    """
    Provide a ``RuleService`` instance.
    """
    return RuleService(RuleRepository())
