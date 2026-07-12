"""
tests/test_dashboard.py

Unit tests for the Dashboard module – service layer.

Strategy
--------
Tests run against an **in-memory SQLite** database.
We seed organizations, tenants, and projects as parents.
"""

import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker

from app.database.base import Base
from app.modules.organizations.models.organization import Organization
from app.modules.tenants.models.tenant import Tenant
from app.modules.projects.models.project import Project
from app.modules.dashboards.models.dashboard import Dashboard
from app.modules.dashboards.schemas.dashboard import (
    DashboardCreate,
    DashboardFilter,
    DashboardUpdate,
)
from app.modules.dashboards.services.dashboard_service import DashboardService
from app.modules.widgets.models.widget import Widget
from app.shared.exceptions.project import ProjectNotFound
from app.shared.exceptions.dashboard import (
    DashboardCodeConflict,
    DashboardNotFound,
)


@pytest.fixture(scope="session")
def engine():
    """Create a single in-memory SQLite engine for the whole test session."""
    _engine = create_engine(
        "sqlite:///:memory:",
        connect_args={"check_same_thread": False},
    )
    Base.metadata.create_all(_engine)
    yield _engine
    Base.metadata.drop_all(_engine)
    _engine.dispose()


@pytest.fixture()
def db(engine) -> Session:
    """Provide a fresh database session per test, isolated by savepoints."""
    connection = engine.connect()
    transaction = connection.begin()

    TestSession = sessionmaker(bind=connection, autocommit=False, autoflush=False)
    session = TestSession()

    yield session

    session.close()
    transaction.rollback()
    connection.close()


@pytest.fixture()
def svc() -> DashboardService:
    """Return a fresh DashboardService for each test."""
    from app.modules.dashboards.repositories.dashboard_repository import DashboardRepository
    return DashboardService(DashboardRepository())


@pytest.fixture()
def seeded_project(db) -> Project:
    """Seed an Organization, Tenant, and Project."""
    org = Organization(
        code="ORG01",
        name="Test Organization",
        email="org@example.com",
        status="ACTIVE",
        license_type="Community"
    )
    db.add(org)
    db.commit()
    db.refresh(org)

    tenant = Tenant(
        organization_id=org.id,
        code="TEN01",
        name="Test Tenant",
        email="tenant@example.com",
        status="ACTIVE"
    )
    db.add(tenant)
    db.commit()
    db.refresh(tenant)

    project = Project(
        tenant_id=tenant.id,
        code="PROJ01",
        name="Test Project",
        status="ACTIVE"
    )
    db.add(project)
    db.commit()
    db.refresh(project)
    return project


@pytest.fixture()
def seeded_project_two(db) -> Project:
    """Seed a second Project to test project scoping."""
    # Reuse tenant from first seed
    tenant = db.query(Tenant).first()
    project = Project(
        tenant_id=tenant.id,
        code="PROJ02",
        name="Second Project",
        status="ACTIVE"
    )
    db.add(project)
    db.commit()
    db.refresh(project)
    return project


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def make_payload(**overrides) -> DashboardCreate:
    """Return a valid DashboardCreate payload with optional field overrides."""
    defaults = {
        "code": "DASH01",
        "name": "Production Overview",
        "description": "Dashboard for production line metrics",
        "layout": {"columns": 12, "rows": 10},
        "theme": "dark",
        "is_public": False,
        "refresh_interval": 30,
    }
    defaults.update(overrides)
    return DashboardCreate(**defaults)


# ---------------------------------------------------------------------------
# Create Dashboard Tests
# ---------------------------------------------------------------------------

class TestCreateDashboard:

    def test_create_success(self, db, svc, seeded_project):
        """Happy path: dashboard is created and linked correctly."""
        payload = make_payload()
        dashboard = svc.create_dashboard(db, seeded_project.id, payload)

        assert dashboard.id is not None
        assert dashboard.project_id == seeded_project.id
        assert dashboard.code == "DASH01"
        assert dashboard.name == "Production Overview"
        assert dashboard.layout == {"columns": 12, "rows": 10}
        assert dashboard.theme == "dark"
        assert dashboard.is_public is False
        assert dashboard.refresh_interval == 30
        assert dashboard.status == "ACTIVE"
        assert dashboard.is_active is True

    def test_create_project_not_found(self, db, svc):
        """Creating dashboard under non-existent project raises ProjectNotFound."""
        with pytest.raises(ProjectNotFound):
            svc.create_dashboard(db, "non-existent-proj", make_payload())

    def test_create_duplicate_code_same_project_raises(self, db, svc, seeded_project):
        """Creating duplicate codes in the same project must raise DashboardCodeConflict."""
        svc.create_dashboard(db, seeded_project.id, make_payload(code="DASH01"))

        with pytest.raises(DashboardCodeConflict):
            svc.create_dashboard(db, seeded_project.id, make_payload(code="DASH01"))

    def test_create_duplicate_code_diff_project_allowed(self, db, svc, seeded_project, seeded_project_two):
        """Creating duplicate codes in different projects is allowed."""
        d1 = svc.create_dashboard(db, seeded_project.id, make_payload(code="DASH01"))
        d2 = svc.create_dashboard(db, seeded_project_two.id, make_payload(code="DASH01"))

        assert d1.id != d2.id
        assert d1.code == d2.code


# ---------------------------------------------------------------------------
# Get Dashboard Tests
# ---------------------------------------------------------------------------

class TestGetDashboard:

    def test_get_dashboard_found(self, db, svc, seeded_project):
        """Fetch dashboard by UUID works."""
        created = svc.create_dashboard(db, seeded_project.id, make_payload())
        found = svc.get_dashboard(db, created.id)

        assert found.id == created.id
        assert found.code == "DASH01"

    def test_get_dashboard_not_found_raises(self, db, svc):
        """get_dashboard raises DashboardNotFound for non-existent ID."""
        with pytest.raises(DashboardNotFound):
            svc.get_dashboard(db, "non-existent-id-0000")


# ---------------------------------------------------------------------------
# Update Dashboard Tests
# ---------------------------------------------------------------------------

class TestUpdateDashboard:

    def test_update_dashboard_fields(self, db, svc, seeded_project):
        """Only the provided fields are updated."""
        dashboard = svc.create_dashboard(db, seeded_project.id, make_payload())
        updated = svc.update_dashboard(
            db,
            dashboard.id,
            DashboardUpdate(name="Updated Dashboard", theme="light", status="INACTIVE")
        )

        assert updated.name == "Updated Dashboard"
        assert updated.theme == "light"
        assert updated.code == "DASH01"
        assert updated.status == "INACTIVE"
        assert updated.is_active is False


# ---------------------------------------------------------------------------
# Delete/Deactivate Dashboard Tests
# ---------------------------------------------------------------------------

class TestDeactivateDashboard:

    def test_deactivate_dashboard_soft_and_cascade_widgets(self, db, svc, seeded_project):
        """Soft-deactivates dashboard and its widgets cascade down."""
        # 1. Create dashboard
        dashboard = svc.create_dashboard(db, seeded_project.id, make_payload())

        # 2. Add widgets directly
        w1 = Widget(
            dashboard_id=dashboard.id,
            code="W1",
            name="Widget 1",
            widget_type="LINE_CHART",
            query_config={"sensors": []},
            status="ACTIVE",
            is_active=True,
        )
        w2 = Widget(
            dashboard_id=dashboard.id,
            code="W2",
            name="Widget 2",
            widget_type="BAR_CHART",
            query_config={"sensors": []},
            status="ACTIVE",
            is_active=True,
        )
        db.add_all([w1, w2])
        db.commit()

        # 3. Soft delete
        svc.deactivate_dashboard(db, dashboard.id)

        # 4. Verify dashboard state
        db.refresh(dashboard)
        assert dashboard.status == "INACTIVE"
        assert dashboard.is_active is False

        # 5. Verify widget states
        db.refresh(w1)
        db.refresh(w2)
        assert w1.status == "INACTIVE"
        assert w1.is_active is False
        assert w2.status == "INACTIVE"
        assert w2.is_active is False


# ---------------------------------------------------------------------------
# List Dashboard Tests
# ---------------------------------------------------------------------------

class TestListDashboards:

    def test_list_by_project(self, db, svc, seeded_project, seeded_project_two):
        """Listing only returns dashboards from the specified project."""
        svc.create_dashboard(db, seeded_project.id, make_payload(code="D1"))
        svc.create_dashboard(db, seeded_project.id, make_payload(code="D2"))
        svc.create_dashboard(db, seeded_project_two.id, make_payload(code="D3"))

        total, items = svc.list_dashboards(db, seeded_project.id, DashboardFilter(), 1, 10)
        assert total == 2
        assert len(items) == 2
        assert {item.code for item in items} == {"D1", "D2"}
