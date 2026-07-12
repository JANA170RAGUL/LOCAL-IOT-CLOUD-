"""
app/shared/exceptions/dashboard.py

Dashboard domain exceptions.
"""

from app.shared.exceptions.base import AppException


class DashboardNotFound(AppException):
    def __init__(self):
        super().__init__(
            message="Dashboard not found.",
            status_code=404,
        )


class DashboardCodeConflict(AppException):
    def __init__(self):
        super().__init__(
            message="Dashboard code already exists in this project.",
            status_code=409,
        )
