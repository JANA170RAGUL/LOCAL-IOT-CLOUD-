"""
app/modules/reports/dependencies.py

FastAPI ``Depends()`` helpers scoped to the Report module.
"""

from __future__ import annotations

# from app.modules.reports.services.report_service import ReportService  # noqa: E501
# Uncomment the import above once the service class is implemented.


def get_report_service():  # type: ignore[return]
    """
    Provide a ``ReportService`` instance.
    Uncomment the body once the service class is implemented.
    """
    # return ReportService()
    raise NotImplementedError("ReportService is not yet implemented.")
