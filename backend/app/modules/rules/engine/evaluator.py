"""
app/modules/rules/engine/evaluator.py

Evaluates telemetry values against rule condition/threshold.
"""

import logging
from typing import Any
from app.modules.rules.models.rule import Rule
from app.database.redis import get_redis_client

logger = logging.getLogger(__name__)


class RuleEvaluator:

    @staticmethod
    def evaluate(rule: Rule, current_value: Any) -> bool:
        """
        Evaluate if the current telemetry value satisfies the rule condition.
        """
        # Try to convert values to float for comparison if numeric
        try:
            val_f = float(current_value)
            thresh_f = float(rule.threshold)
            is_numeric = True
        except (ValueError, TypeError):
            val_f = None
            thresh_f = None
            is_numeric = False

        cond = rule.condition.upper()

        if cond == ">":
            return is_numeric and val_f > thresh_f
        elif cond == "<":
            return is_numeric and val_f < thresh_f
        elif cond == ">=":
            return is_numeric and val_f >= thresh_f
        elif cond == "<=":
            return is_numeric and val_f <= thresh_f
        elif cond == "==":
            if is_numeric:
                return val_f == thresh_f
            return str(current_value) == str(rule.threshold)
        elif cond == "!=":
            if is_numeric:
                return val_f != thresh_f
            return str(current_value) != str(rule.threshold)
        elif cond == "BETWEEN":
            if not is_numeric:
                return False
            upper_limit = rule.action_config.get("upper_threshold")
            if upper_limit is None:
                return False
            try:
                upper_f = float(upper_limit)
                return thresh_f <= val_f <= upper_f
            except ValueError:
                return False
        elif cond in ("IN", "NOT_IN"):
            allowed_list = rule.action_config.get("list", [])
            val_str = str(current_value)
            is_in = val_str in [str(item) for item in allowed_list]
            return is_in if cond == "IN" else not is_in

        # Stateful operations that require looking up previous value in Redis
        elif cond in ("CHANGED", "INCREASED", "DECREASED"):
            r = get_redis_client()
            last_val_key = f"sensor:last_value:{rule.sensor_id}"
            last_val_bytes = r.get(last_val_key)

            if last_val_bytes is None:
                # No previous value to compare against, so default to False
                return False

            last_val_str = last_val_bytes.decode("utf-8")
            try:
                last_val_f = float(last_val_str)
                last_is_numeric = True
            except ValueError:
                last_val_f = None
                last_is_numeric = False

            if cond == "CHANGED":
                if is_numeric and last_is_numeric:
                    return val_f != last_val_f
                return str(current_value) != last_val_str

            elif cond == "INCREASED":
                return is_numeric and last_is_numeric and val_f > last_val_f

            elif cond == "DECREASED":
                return is_numeric and last_is_numeric and val_f < last_val_f

        logger.warning(f"Unsupported rule condition: {rule.condition}")
        return False
