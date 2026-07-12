"""
app/shared/exceptions/alert.py

Alert domain exceptions.
"""

from app.shared.exceptions.base import AppException


class AlertNotFound(AppException):
    def __init__(self):
        super().__init__(
            message="Alert not found.",
            status_code=404,
        )
