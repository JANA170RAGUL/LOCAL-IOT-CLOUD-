"""
app/modules/rules/engine/cooldown.py

Handles evaluation cooldown using Redis.
"""

from app.modules.rules.models.rule import Rule
from app.database.redis import get_redis_client


class CooldownManager:

    @staticmethod
    def is_in_cooldown(rule: Rule) -> bool:
        """
        Check if a rule is in cooldown.
        If in cooldown, returns True.
        """
        if rule.cooldown_seconds <= 0:
            return False

        r = get_redis_client()
        cooldown_key = f"rule:cooldown:{rule.id}"
        # If the key exists, it means we are in cooldown.
        return bool(r.exists(cooldown_key))

    @staticmethod
    def set_cooldown(rule: Rule) -> None:
        """
        Start the cooldown timer for a rule.
        """
        if rule.cooldown_seconds <= 0:
            return

        r = get_redis_client()
        cooldown_key = f"rule:cooldown:{rule.id}"
        # Set key with TTL of cooldown_seconds
        r.setex(cooldown_key, rule.cooldown_seconds, "active")
