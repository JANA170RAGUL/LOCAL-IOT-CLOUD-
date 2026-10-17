"""
app/modules/licensing/services/license_usage.py

System-wide active resource counter for license capacity verification in LocalIoTCloud.
Uses dynamic model imports to avoid circular module initialization dependencies.
"""

from __future__ import annotations

from sqlalchemy import func, select
from sqlalchemy.orm import Session


class LicenseUsageService:
    @staticmethod
    def _count_active(db: Session, model: type, active_col: str = "is_active") -> int:
        stmt = select(func.count(model.id))
        if hasattr(model, active_col):
            stmt = stmt.where(getattr(model, active_col).is_(True))
        return int(db.scalar(stmt) or 0)

    def count_organizations(self, db: Session) -> int:
        from app.modules.organizations.models.organization import Organization
        return self._count_active(db, Organization)

    def count_users(self, db: Session) -> int:
        from app.modules.users.models.user import User
        return self._count_active(db, User)

    def count_gateways(self, db: Session) -> int:
        from app.modules.gateways.models.gateway import Gateway
        return self._count_active(db, Gateway)

    def count_devices(self, db: Session) -> int:
        from app.modules.devices.models.device import Device
        return self._count_active(db, Device)

    def count_dashboards(self, db: Session) -> int:
        from app.modules.dashboards.models.dashboard import Dashboard
        return self._count_active(db, Dashboard)

    def count_widgets(self, db: Session) -> int:
        from app.modules.widgets.models.widget import Widget
        return self._count_active(db, Widget)

    def count_channels(self, db: Session) -> int:
        from app.modules.channels.models.channel import Channel
        return self._count_active(db, Channel)


license_usage = LicenseUsageService()
