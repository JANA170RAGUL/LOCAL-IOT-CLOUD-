"""
app/modules/rules/dependencies.py

FastAPI ``Depends()`` helpers scoped to the Rule module.
"""

from __future__ import annotations

# from app.modules.rules.services.rule_service import RuleService  # noqa: E501
# Uncomment the import above once the service class is implemented.


def get_rule_service():  # type: ignore[return]
    """
    Provide a ``RuleService`` instance.
    Uncomment the body once the service class is implemented.
    """
    # return RuleService()
    raise NotImplementedError("RuleService is not yet implemented.")
