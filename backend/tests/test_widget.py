"""
tests/test_widget.py

Unit tests for the Widget module – service layer.

Strategy
--------
Tests run against an **in-memory SQLite** database.
We seed organizations, tenants, projects, and dashboards as parents.
"""

import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker

from app.database.base import Base
from app.modules.organizations.models.organization import Organization
from app.modules.tenants.models.tenant import Tenant
from app.modules.projects.models.project import Project
from app.modules.dashboards.models.dashboard import Dashboard
from app.modules.widgets.models.widget import Widget
from app.modules.widgets.schemas.widget import (
    WidgetCreate,
    WidgetUpdate,
)
from app.modules.widgets.services.widget_service import WidgetService
from app.shared.widgets.widget_types import WidgetType
from app.shared.exceptions.dashboard import DashboardNotFound
from app.shared.exceptions.widget import (
    WidgetCodeConflict,
    WidgetNotFound,
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
def svc() -> WidgetService:
    """Return a fresh WidgetService for each test."""
    from app.modules.widgets.repositories.widget_repository import WidgetRepository
    return WidgetService(WidgetRepository())


@pytest.fixture()
def seeded_dashboard(db) -> Dashboard:
    """Seed hierarchy up to Dashboard."""
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

    dashboard = Dashboard(
        project_id=project.id,
        code="DASH01",
        name="Test Dashboard",
        status="ACTIVE"
    )
    db.add(dashboard)
    db.commit()
    db.refresh(dashboard)
    return dashboard


@pytest.fixture()
def seeded_dashboard_two(db) -> Dashboard:
    """Seed a second Dashboard to test scoping."""
    # Reuse project from first seed
    project = db.query(Project).first()
    dashboard = Dashboard(
        project_id=project.id,
        code="DASH02",
        name="Second Dashboard",
        status="ACTIVE"
    )
    db.add(dashboard)
    db.commit()
    db.refresh(dashboard)
    return dashboard


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def make_payload(**overrides) -> WidgetCreate:
    """Return a valid WidgetCreate payload with optional field overrides."""
    defaults = {
        "code": "WIDG01",
        "name": "Temperature Line Chart",
        "title": "Room Temp History",
        "description": "Visualizes telemetry from room sensors",
        "widget_type": WidgetType.LINE_CHART,
        "data_source": "telemetry",
        "query_config": {"sensors": ["sensor-1", "sensor-2"], "aggregate": "mean"},
        "display_config": {"color": "#ff0000", "show_legend": True},
        "refresh_interval": 10,
        "position_x": 0,
        "position_y": 0,
        "width": 6,
        "height": 4,
    }
    defaults.update(overrides)
    return WidgetCreate(**defaults)


# ---------------------------------------------------------------------------
# Create Widget Tests
# ---------------------------------------------------------------------------

class TestCreateWidget:

    def test_create_success(self, db, svc, seeded_dashboard):
        """Happy path: widget is created and linked correctly."""
        payload = make_payload()
        widget = svc.create_widget(db, seeded_dashboard.id, payload)

        assert widget.id is not None
        assert widget.dashboard_id == seeded_dashboard.id
        assert widget.code == "WIDG01"
        assert widget.name == "Temperature Line Chart"
        assert widget.title == "Room Temp History"
        assert widget.widget_type == "LINE_CHART"
        assert widget.position_x == 0
        assert widget.position_y == 0
        assert widget.width == 6
        assert widget.height == 4
        assert widget.status == "ACTIVE"
        assert widget.is_active is True

    def test_create_dashboard_not_found(self, db, svc):
        """Creating widget under non-existent dashboard raises DashboardNotFound."""
        with pytest.raises(DashboardNotFound):
            svc.create_widget(db, "non-existent-dash", make_payload())

    def test_create_duplicate_code_same_dashboard_raises(self, db, svc, seeded_dashboard):
        """Creating duplicate codes in the same dashboard must raise WidgetCodeConflict."""
        svc.create_widget(db, seeded_dashboard.id, make_payload(code="WIDG01"))

        with pytest.raises(WidgetCodeConflict):
            svc.create_widget(db, seeded_dashboard.id, make_payload(code="WIDG01"))

    def test_create_duplicate_code_diff_dashboard_allowed(self, db, svc, seeded_dashboard, seeded_dashboard_two):
        """Creating duplicate codes in different dashboards is allowed."""
        w1 = svc.create_widget(db, seeded_dashboard.id, make_payload(code="WIDG01"))
        w2 = svc.create_widget(db, seeded_dashboard_two.id, make_payload(code="WIDG01"))

        assert w1.id != w2.id
        assert w1.code == w2.code


# ---------------------------------------------------------------------------
# Get Widget Tests
# ---------------------------------------------------------------------------

class TestGetWidget:

    def test_get_widget_found(self, db, svc, seeded_dashboard):
        """Fetch widget by UUID works."""
        created = svc.create_widget(db, seeded_dashboard.id, make_payload())
        found = svc.get_widget(db, created.id)

        assert found.id == created.id
        assert found.code == "WIDG01"

    def test_get_widget_not_found_raises(self, db, svc):
        """get_widget raises WidgetNotFound for non-existent ID."""
        with pytest.raises(WidgetNotFound):
            svc.get_widget(db, "non-existent-id-0000")


# ---------------------------------------------------------------------------
# Update Widget Tests
# ---------------------------------------------------------------------------

class TestUpdateWidget:

    def test_update_widget_fields(self, db, svc, seeded_dashboard):
        """Only the provided fields are updated."""
        widget = svc.create_widget(db, seeded_dashboard.id, make_payload())
        updated = svc.update_widget(
            db,
            widget.id,
            WidgetUpdate(name="Updated Widget", position_x=2, width=8, widget_type=WidgetType.BAR_CHART, status="INACTIVE")
        )

        assert updated.name == "Updated Widget"
        assert updated.position_x == 2
        assert updated.width == 8
        assert updated.widget_type == "BAR_CHART"
        assert updated.status == "INACTIVE"
        assert updated.is_active is False


# ---------------------------------------------------------------------------
# Delete/Deactivate Widget Tests
# ---------------------------------------------------------------------------

class TestDeactivateWidget:

    def test_deactivate_widget_soft(self, db, svc, seeded_dashboard):
        """Soft-deactivates widget by setting is_active=False and status=INACTIVE."""
        widget = svc.create_widget(db, seeded_dashboard.id, make_payload())
        svc.deactivate_widget(db, widget.id)

        # Re-fetch directly to verify
        with pytest.raises(WidgetNotFound):
            svc.get_widget(db, widget.id)

        db.refresh(widget)
        assert widget.is_active is False
        assert widget.status == "INACTIVE"


# ---------------------------------------------------------------------------
# List Widget Tests
# ---------------------------------------------------------------------------

class TestListWidgets:

    def test_list_by_dashboard(self, db, svc, seeded_dashboard, seeded_dashboard_two):
        """Listing only returns widgets from the specified dashboard."""
        svc.create_widget(db, seeded_dashboard.id, make_payload(code="W1"))
        svc.create_widget(db, seeded_dashboard.id, make_payload(code="W2"))
        svc.create_widget(db, seeded_dashboard_two.id, make_payload(code="W3"))

        items = svc.list_widgets(db, seeded_dashboard.id)
        assert len(items) == 2
        assert {item.code for item in items} == {"W1", "W2"}
