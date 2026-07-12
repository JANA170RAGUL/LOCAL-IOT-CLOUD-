"""
app/shared/exceptions/rule.py

Rule domain exceptions.
"""

from app.shared.exceptions.base import AppException


class RuleNotFound(AppException):
    def __init__(self):
        super().__init__(
            message="Rule not found.",
            status_code=404,
        )


class RuleCodeConflict(AppException):
    def __init__(self):
        super().__init__(
            message="Rule code already exists in this project.",
            status_code=409,
        )
