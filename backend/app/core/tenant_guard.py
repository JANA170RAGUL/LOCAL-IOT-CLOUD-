from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.access_scope import AccessScope

from app.core.access_scope import AccessScope


def _not_found():
    """
    Return 404 instead of 403 so that users cannot discover
    whether another organization's resource exists.
    """
    raise HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail="Resource not found.",
    )


class TenantGuard:

    # ============================================================
    # ORGANIZATION
    # ============================================================

    @staticmethod
    def organization(
        db: Session,
        organization_id: str,
        scope: AccessScope,
    ):
        from app.modules.organizations.models.organization import Organization

        stmt = select(Organization).where(
            Organization.id == organization_id
        )

        if not scope.is_global:
            stmt = stmt.where(
                Organization.id == scope.organization_id
            )

        obj = db.scalar(stmt)

        if not obj:
            _not_found()

        return obj

    # ============================================================
    # TENANT
    # ============================================================

    @staticmethod
    def tenant(
        db: Session,
        tenant_id: str,
        scope: AccessScope,
    ):
        from app.modules.tenants.models.tenant import Tenant

        stmt = select(Tenant).where(
            Tenant.id == tenant_id
        )

        if not scope.is_global:

            stmt = stmt.where(
                Tenant.organization_id == scope.organization_id
            )

            if scope.tenant_id:
                stmt = stmt.where(
                    Tenant.id == scope.tenant_id
                )

        obj = db.scalar(stmt)

        if not obj:
            _not_found()

        return obj

    # ============================================================
    # PROJECT
    # Organization → Tenant → Project
    # ============================================================

    @staticmethod
    def project(
        db: Session,
        project_id: str,
        scope: AccessScope,
    ):
        from app.modules.tenants.models.tenant import Tenant
        from app.modules.projects.models.project import Project

        stmt = (
            select(Project)
            .join(
                Tenant,
                Project.tenant_id == Tenant.id,
            )
            .where(Project.id == project_id)
        )

        if not scope.is_global:

            stmt = stmt.where(
                Tenant.organization_id == scope.organization_id
            )

            if scope.tenant_id:
                stmt = stmt.where(
                    Project.tenant_id == scope.tenant_id
                )

        obj = db.scalar(stmt)

        if not obj:
            _not_found()

        return obj

    # ============================================================
    # GATEWAY
    # Organization → Tenant → Project → Gateway
    # ============================================================

    @staticmethod
    def gateway(
        db: Session,
        gateway_id: str,
        scope: AccessScope,
    ):
        from app.modules.tenants.models.tenant import Tenant
        from app.modules.projects.models.project import Project
        from app.modules.gateways.models.gateway import Gateway

        stmt = (
            select(Gateway)
            .join(
                Project,
                Gateway.project_id == Project.id,
            )
            .join(
                Tenant,
                Project.tenant_id == Tenant.id,
            )
            .where(Gateway.id == gateway_id)
        )

        if not scope.is_global:

            stmt = stmt.where(
                Tenant.organization_id == scope.organization_id
            )

            if scope.tenant_id:
                stmt = stmt.where(
                    Tenant.id == scope.tenant_id
                )

        obj = db.scalar(stmt)

        if not obj:
            _not_found()

        return obj

    # ============================================================
    # DEVICE
    # Organization → Tenant → Project → Gateway → Device
    # ============================================================

    @staticmethod
    def device(
        db: Session,
        device_id: str,
        scope: AccessScope,
    ):
        from app.modules.tenants.models.tenant import Tenant
        from app.modules.projects.models.project import Project
        from app.modules.gateways.models.gateway import Gateway
        from app.modules.devices.models.device import Device

        stmt = (
            select(Device)
            .join(
                Gateway,
                Device.gateway_id == Gateway.id,
            )
            .join(
                Project,
                Gateway.project_id == Project.id,
            )
            .join(
                Tenant,
                Project.tenant_id == Tenant.id,
            )
            .where(Device.id == device_id)
        )

        if not scope.is_global:

            stmt = stmt.where(
                Tenant.organization_id == scope.organization_id
            )

            if scope.tenant_id:
                stmt = stmt.where(
                    Tenant.id == scope.tenant_id
                )

        obj = db.scalar(stmt)

        if not obj:
            _not_found()

        return obj

    # ============================================================
    # SENSOR
    # Org → Tenant → Project → Gateway → Device → Sensor
    # ============================================================

    @staticmethod
    def sensor(
        db: Session,
        sensor_id: str,
        scope: AccessScope,
    ):
        from app.modules.tenants.models.tenant import Tenant
        from app.modules.projects.models.project import Project
        from app.modules.gateways.models.gateway import Gateway
        from app.modules.devices.models.device import Device
        from app.modules.sensors.models.sensor import Sensor

        stmt = (
            select(Sensor)
            .join(
                Device,
                Sensor.device_id == Device.id,
            )
            .join(
                Gateway,
                Device.gateway_id == Gateway.id,
            )
            .join(
                Project,
                Gateway.project_id == Project.id,
            )
            .join(
                Tenant,
                Project.tenant_id == Tenant.id,
            )
            .where(Sensor.id == sensor_id)
        )

        if not scope.is_global:

            stmt = stmt.where(
                Tenant.organization_id == scope.organization_id
            )

            if scope.tenant_id:
                stmt = stmt.where(
                    Tenant.id == scope.tenant_id
                )

        obj = db.scalar(stmt)

        if not obj:
            _not_found()

        return obj

    # ============================================================
    # DASHBOARD
    # ============================================================

    @staticmethod
    def dashboard(
        db: Session,
        dashboard_id: str,
        scope: AccessScope,
    ):
        from app.modules.tenants.models.tenant import Tenant
        from app.modules.projects.models.project import Project
        from app.modules.dashboards.models.dashboard import Dashboard

        stmt = (
            select(Dashboard)
            .join(
                Project,
                Dashboard.project_id == Project.id,
            )
            .join(
                Tenant,
                Project.tenant_id == Tenant.id,
            )
            .where(Dashboard.id == dashboard_id)
        )

        if not scope.is_global:

            stmt = stmt.where(
                Tenant.organization_id == scope.organization_id
            )

            if scope.tenant_id:
                stmt = stmt.where(
                    Tenant.id == scope.tenant_id
                )

        obj = db.scalar(stmt)

        if not obj:
            _not_found()

        return obj

    # ============================================================
    # WIDGET
    # ============================================================

    @staticmethod
    def widget(
        db: Session,
        widget_id: str,
        scope: AccessScope,
    ):
        from app.modules.tenants.models.tenant import Tenant
        from app.modules.projects.models.project import Project
        from app.modules.dashboards.models.dashboard import Dashboard
        from app.modules.widgets.models.widget import Widget

        stmt = (
            select(Widget)
            .join(
                Dashboard,
                Widget.dashboard_id == Dashboard.id,
            )
            .join(
                Project,
                Dashboard.project_id == Project.id,
            )
            .join(
                Tenant,
                Project.tenant_id == Tenant.id,
            )
            .where(Widget.id == widget_id)
        )

        if not scope.is_global:

            stmt = stmt.where(
                Tenant.organization_id == scope.organization_id
            )

            if scope.tenant_id:
                stmt = stmt.where(
                    Tenant.id == scope.tenant_id
                )

        obj = db.scalar(stmt)

        if not obj:
            _not_found()

        return obj

    # ============================================================
    # RULE
    # ============================================================

    @staticmethod
    def rule(
        db: Session,
        rule_id: str,
        scope: AccessScope,
    ):
        from app.modules.tenants.models.tenant import Tenant
        from app.modules.projects.models.project import Project
        from app.modules.rules.models.rule import Rule

        stmt = (
            select(Rule)
            .join(
                Project,
                Rule.project_id == Project.id,
            )
            .join(
                Tenant,
                Project.tenant_id == Tenant.id,
            )
            .where(Rule.id == rule_id)
        )

        if not scope.is_global:

            stmt = stmt.where(
                Tenant.organization_id == scope.organization_id
            )

            if scope.tenant_id:
                stmt = stmt.where(
                    Tenant.id == scope.tenant_id
                )

        obj = db.scalar(stmt)

        if not obj:
            _not_found()

        return obj

    # ============================================================
    # COMMAND
    # ============================================================

    @staticmethod
    def command(
        db: Session,
        command_id: str,
        scope: AccessScope,
    ):
        from app.modules.tenants.models.tenant import Tenant
        from app.modules.projects.models.project import Project
        from app.modules.gateways.models.gateway import Gateway
        from app.modules.devices.models.device import Device
        from app.modules.commands.models.command import DeviceCommand

        stmt = (
            select(DeviceCommand)
            .join(
                Device,
                DeviceCommand.device_id == Device.id,
            )
            .join(
                Gateway,
                Device.gateway_id == Gateway.id,
            )
            .join(
                Project,
                Gateway.project_id == Project.id,
            )
            .join(
                Tenant,
                Project.tenant_id == Tenant.id,
            )
            .where(DeviceCommand.id == command_id)
        )

        if not scope.is_global:

            stmt = stmt.where(
                Tenant.organization_id == scope.organization_id
            )

            if scope.tenant_id:
                stmt = stmt.where(
                    Tenant.id == scope.tenant_id
                )

        obj = db.scalar(stmt)

        if not obj:
            _not_found()

        return obj