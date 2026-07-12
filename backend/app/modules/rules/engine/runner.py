"""
app/modules/rules/engine/runner.py

Orchestrates the loading, evaluation, cooldown checking, and dispatching of rules.
"""

import logging
from sqlalchemy.orm import Session
from app.modules.rules.engine.rule_loader import RuleLoader
from app.modules.rules.engine.evaluator import RuleEvaluator
from app.modules.rules.engine.cooldown import CooldownManager
from app.modules.rules.engine.dispatcher import ActionDispatcher
from app.database.redis import get_redis_client

logger = logging.getLogger(__name__)


class RuleEngineRunner:

    @classmethod
    def evaluate_and_trigger(cls, db: Session, record: dict) -> None:
        """
        Evaluate all active rules configured for the sensor in the telemetry record.
        """
        sensor_id = record.get("sensor_id")
        if not sensor_id:
            logger.debug("Telemetry record has no sensor_id, skipping rule evaluation.")
            return

        current_value = record.get("value")
        timestamp = record.get("timestamp")
        timestamp_str = timestamp.isoformat() if hasattr(timestamp, "isoformat") else str(timestamp)

        # 1. Load all active rules for this sensor
        rules = RuleLoader.load_active_rules_for_sensor(db, sensor_id)
        if not rules:
            # No rules configured for this sensor, but still update the state in Redis
            cls._update_last_value(sensor_id, current_value)
            return

        # 2. Evaluate each rule
        for rule in rules:
            try:
                # Check condition
                is_triggered = RuleEvaluator.evaluate(rule, current_value)
                if not is_triggered:
                    continue

                # Check cooldown
                if CooldownManager.is_in_cooldown(rule):
                    logger.info(f"Rule {rule.code} is triggered but ignored due to cooldown.")
                    continue

                # Triggered and not in cooldown -> Activate cooldown and dispatch actions
                CooldownManager.set_cooldown(rule)
                ActionDispatcher.dispatch(
                    db,
                    rule,
                    current_value,
                    timestamp_str,
                    device_id=record.get("device_id"),
                )

            except Exception as e:
                logger.error(f"Failed to evaluate rule {rule.code} (ID: {rule.id}): {e}", exc_info=True)

        # 3. Update the last value key in Redis at the end of the cycle for stateful rules
        cls._update_last_value(sensor_id, current_value)

    @classmethod
    def _update_last_value(cls, sensor_id: str, value: Any) -> None:
        try:
            r = get_redis_client()
            last_val_key = f"sensor:last_value:{sensor_id}"
            r.set(last_val_key, str(value))
        except Exception as e:
            logger.error(f"Failed to update last sensor value in Redis: {e}")
