"""
app/shared/exceptions/widget.py

Widget domain exceptions.
"""

from app.shared.exceptions.base import AppException


class WidgetNotFound(AppException):
    def __init__(self):
        super().__init__(
            message="Widget not found.",
            status_code=404,
        )


class WidgetCodeConflict(AppException):
    def __init__(self):
        super().__init__(
            message="Widget code already exists in this dashboard.",
            status_code=409,
        )
