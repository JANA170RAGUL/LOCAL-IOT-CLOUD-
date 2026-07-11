"""
tests/test_project.py

Unit tests for the Project module – service layer.

Strategy
--------
Tests run against an **in-memory SQLite** database.
We seed organizations and tenants as parents since projects require a valid tenant_id.
"""

import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session

from app.database.base import Base
from app.modules.organizations.models.organization import Organization
from app.modules.tenants.models.tenant import Tenant
from app.modules.projects.models.project import Project
from app.modules.projects.schemas.project import (
    ProjectCreate,
    ProjectFilter,
    ProjectUpdate,
)
from app.modules.projects.services.project_service import ProjectService
from app.shared.exceptions.project import (
    ProjectCodeTaken,
    ProjectNotFound,
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
def svc() -> ProjectService:
    """Return a fresh ProjectService for each test."""
    return ProjectService()


@pytest.fixture()
def seeded_tenant(db) -> Tenant:
    """Seed an Organization and Tenant for project tests."""
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
    return tenant


@pytest.fixture()
def seeded_tenant_two(db) -> Tenant:
    """Seed a second Tenant to test tenant scoping."""
    # Re-use the same organization for simplicity
    org = db.query(Organization).first()
    tenant = Tenant(
        organization_id=org.id,
        code="TEN02",
        name="Second Tenant",
        email="tenant2@example.com",
        status="ACTIVE"
    )
    db.add(tenant)
    db.commit()
    db.refresh(tenant)
    return tenant


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def make_payload(**overrides) -> ProjectCreate:
    """Return a valid ProjectCreate payload with optional field overrides."""
    defaults = {
        "code": "PROJ01",
        "name": "Smart Classroom",
        "description": "IoT monitoring for classroom",
        "status": "ACTIVE",
    }
    defaults.update(overrides)
    return ProjectCreate(**defaults)


# ---------------------------------------------------------------------------
# Create Project Tests
# ---------------------------------------------------------------------------

class TestCreateProject:

    def test_create_success(self, db, svc, seeded_tenant):
        """Happy path: project is created and linked correctly."""
        payload = make_payload()
        project = svc.create_project(db, seeded_tenant.id, payload)

        assert project.id is not None
        assert project.tenant_id == seeded_tenant.id
        assert project.code == "PROJ01"
        assert project.name == "Smart Classroom"
        assert project.description == "IoT monitoring for classroom"
        assert project.status == "ACTIVE"
        assert project.is_active is True

    def test_create_duplicate_code_same_tenant_raises(self, db, svc, seeded_tenant):
        """Creating duplicate codes in the same tenant must raise ProjectCodeTaken."""
        svc.create_project(db, seeded_tenant.id, make_payload(code="PROJ01"))

        with pytest.raises(ProjectCodeTaken):
            svc.create_project(db, seeded_tenant.id, make_payload(code="PROJ01"))

    def test_create_duplicate_code_diff_tenant_allowed(self, db, svc, seeded_tenant, seeded_tenant_two):
        """Creating duplicate codes in different tenants is allowed."""
        p1 = svc.create_project(db, seeded_tenant.id, make_payload(code="PROJ01"))
        p2 = svc.create_project(db, seeded_tenant_two.id, make_payload(code="PROJ01"))

        assert p1.id != p2.id
        assert p1.code == p2.code


# ---------------------------------------------------------------------------
# Get Project Tests
# ---------------------------------------------------------------------------

class TestGetProject:

    def test_get_project_found(self, db, svc, seeded_tenant):
        """Fetch project by UUID works."""
        created = svc.create_project(db, seeded_tenant.id, make_payload())
        found = svc.get_project(db, created.id)

        assert found.id == created.id
        assert found.code == "PROJ01"

    def test_get_project_not_found_raises(self, db, svc):
        """get_project raises ProjectNotFound for non-existent ID."""
        with pytest.raises(ProjectNotFound):
            svc.get_project(db, "non-existent-id-0000")

    def test_get_project_by_code(self, db, svc, seeded_tenant):
        """Fetch project by tenant and code works."""
        created = svc.create_project(db, seeded_tenant.id, make_payload())
        found = svc.get_project_by_code(db, seeded_tenant.id, "PROJ01")

        assert found.id == created.id


# ---------------------------------------------------------------------------
# Update Project Tests
# ---------------------------------------------------------------------------

class TestUpdateProject:

    def test_update_project_name(self, db, svc, seeded_tenant):
        """Only the provided fields are updated."""
        project = svc.create_project(db, seeded_tenant.id, make_payload())
        updated = svc.update_project(db, project.id, ProjectUpdate(name="Updated Project Name"))

        assert updated.name == "Updated Project Name"
        assert updated.code == "PROJ01"


# ---------------------------------------------------------------------------
# Delete Project Tests
# ---------------------------------------------------------------------------

class TestDeleteProject:

    def test_deactivate_project_soft(self, db, svc, seeded_tenant):
        """Soft-deletes project by setting is_active=False and status=INACTIVE."""
        project = svc.create_project(db, seeded_tenant.id, make_payload())
        res = svc.deactivate_project(db, project.id)

        assert "deactivated" in res["message"].lower()

        # Re-fetch directly to verify
        fetched = svc.get_project(db, project.id)
        assert fetched.is_active is False
        assert fetched.status == "INACTIVE"


# ---------------------------------------------------------------------------
# List Project Tests
# ---------------------------------------------------------------------------

class TestListProjects:

    def test_list_by_tenant(self, db, svc, seeded_tenant, seeded_tenant_two):
        """Listing only returns projects from the specified tenant."""
        svc.create_project(db, seeded_tenant.id, make_payload(code="P1"))
        svc.create_project(db, seeded_tenant.id, make_payload(code="P2"))
        svc.create_project(db, seeded_tenant_two.id, make_payload(code="P3"))

        res = svc.list_projects(db, seeded_tenant.id, ProjectFilter())
        assert res.total == 2
        assert len(res.items) == 2
        assert {item.code for item in res.items} == {"P1", "P2"}
