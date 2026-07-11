"""
tests/test_tenant.py

Unit tests for the Tenant module – service layer.

Strategy
--------
Tests run against an **in-memory SQLite** database.
We seed organizations as parents since tenants require a valid organization_id (RESTRICT).
"""

import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session

from app.database.base import Base
from app.modules.organizations.models.organization import Organization
from app.modules.tenants.models.tenant import Tenant
from app.modules.tenants.schemas.tenant import (
    TenantCreate,
    TenantFilter,
    TenantUpdate,
)
from app.modules.tenants.services.tenant_service import TenantService
from app.shared.exceptions.tenant import (
    TenantCodeTaken,
    TenantEmailTaken,
    TenantNotFound,
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
def svc() -> TenantService:
    """Return a fresh TenantService for each test."""
    return TenantService()


@pytest.fixture()
def seeded_org(db) -> Organization:
    """Seed a default Organization for tenant tests."""
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
    return org


@pytest.fixture()
def seeded_org_two(db) -> Organization:
    """Seed a second Organization for testing multi-org scoping."""
    org = Organization(
        code="ORG02",
        name="Second Organization",
        email="org2@example.com",
        status="ACTIVE",
        license_type="Community"
    )
    db.add(org)
    db.commit()
    db.refresh(org)
    return org


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def make_payload(**overrides) -> TenantCreate:
    """Return a valid TenantCreate payload with optional field overrides."""
    defaults = {
        "code": "LAB01",
        "name": "Idea Lab 01",
        "email": "lab01@example.com",
        "status": "ACTIVE",
    }
    defaults.update(overrides)
    return TenantCreate(**defaults)


# ---------------------------------------------------------------------------
# Create Tenant Tests
# ---------------------------------------------------------------------------

class TestCreateTenant:

    def test_create_success(self, db, svc, seeded_org):
        """Happy path: tenant is created and linked correctly."""
        payload = make_payload()
        tenant = svc.create_tenant(db, seeded_org.id, payload)

        assert tenant.id is not None
        assert tenant.organization_id == seeded_org.id
        assert tenant.code == "LAB01"
        assert tenant.name == "Idea Lab 01"
        assert tenant.email == "lab01@example.com"
        assert tenant.status == "ACTIVE"
        assert tenant.is_active is True

    def test_create_duplicate_code_same_org_raises(self, db, svc, seeded_org):
        """Creating duplicate codes in the same organization must raise TenantCodeTaken."""
        svc.create_tenant(db, seeded_org.id, make_payload(code="LAB01", email="email1@example.com"))

        with pytest.raises(TenantCodeTaken):
            svc.create_tenant(db, seeded_org.id, make_payload(code="LAB01", email="email2@example.com"))

    def test_create_duplicate_code_diff_org_allowed(self, db, svc, seeded_org, seeded_org_two):
        """Creating duplicate codes in different organizations is allowed."""
        t1 = svc.create_tenant(db, seeded_org.id, make_payload(code="LAB01", email="email1@example.com"))
        t2 = svc.create_tenant(db, seeded_org_two.id, make_payload(code="LAB01", email="email2@example.com"))

        assert t1.id != t2.id
        assert t1.code == t2.code

    def test_create_duplicate_email_raises(self, db, svc, seeded_org):
        """Creating duplicate emails globally must raise TenantEmailTaken."""
        svc.create_tenant(db, seeded_org.id, make_payload(code="LAB01", email="same@example.com"))

        with pytest.raises(TenantEmailTaken):
            svc.create_tenant(db, seeded_org.id, make_payload(code="LAB02", email="same@example.com"))


# ---------------------------------------------------------------------------
# Get Tenant Tests
# ---------------------------------------------------------------------------

class TestGetTenant:

    def test_get_tenant_found(self, db, svc, seeded_org):
        """Fetch tenant by UUID works."""
        created = svc.create_tenant(db, seeded_org.id, make_payload())
        found = svc.get_tenant(db, created.id)

        assert found.id == created.id
        assert found.code == "LAB01"

    def test_get_tenant_not_found_raises(self, db, svc):
        """get_tenant raises TenantNotFound for non-existent ID."""
        with pytest.raises(TenantNotFound):
            svc.get_tenant(db, "non-existent-id-0000")

    def test_get_tenant_by_code(self, db, svc, seeded_org):
        """Fetch tenant by organization and code works."""
        created = svc.create_tenant(db, seeded_org.id, make_payload())
        found = svc.get_tenant_by_code(db, seeded_org.id, "LAB01")

        assert found.id == created.id


# ---------------------------------------------------------------------------
# Update Tenant Tests
# ---------------------------------------------------------------------------

class TestUpdateTenant:

    def test_update_tenant_name(self, db, svc, seeded_org):
        """Only the provided fields are updated."""
        tenant = svc.create_tenant(db, seeded_org.id, make_payload())
        updated = svc.update_tenant(db, tenant.id, TenantUpdate(name="Updated Lab Name"))

        assert updated.name == "Updated Lab Name"
        assert updated.code == "LAB01"

    def test_update_tenant_email_conflict(self, db, svc, seeded_org):
        """Updating email to one already owned by another tenant raises TenantEmailTaken."""
        t1 = svc.create_tenant(db, seeded_org.id, make_payload(code="LAB01", email="email1@example.com"))
        svc.create_tenant(db, seeded_org.id, make_payload(code="LAB02", email="email2@example.com"))

        with pytest.raises(TenantEmailTaken):
            svc.update_tenant(db, t1.id, TenantUpdate(email="email2@example.com"))

    def test_update_tenant_same_email_allowed(self, db, svc, seeded_org):
        """Updating with own email does not raise conflict."""
        tenant = svc.create_tenant(db, seeded_org.id, make_payload())
        updated = svc.update_tenant(db, tenant.id, TenantUpdate(email="lab01@example.com"))

        assert updated.email == "lab01@example.com"


# ---------------------------------------------------------------------------
# Delete Tenant Tests
# ---------------------------------------------------------------------------

class TestDeleteTenant:

    def test_deactivate_tenant_soft(self, db, svc, seeded_org):
        """Soft-deletes tenant by setting is_active=False and status=INACTIVE."""
        tenant = svc.create_tenant(db, seeded_org.id, make_payload())
        res = svc.deactivate_tenant(db, tenant.id)

        assert "deactivated" in res["message"].lower()

        # Re-fetch directly to verify
        fetched = svc.get_tenant(db, tenant.id)
        assert fetched.is_active is False
        assert fetched.status == "INACTIVE"


# ---------------------------------------------------------------------------
# List Tenant Tests
# ---------------------------------------------------------------------------

class TestListTenants:

    def test_list_by_organization(self, db, svc, seeded_org, seeded_org_two):
        """Listing only returns tenants from the specified organization."""
        # Org 1 tenants
        svc.create_tenant(db, seeded_org.id, make_payload(code="T1", email="t1@example.com"))
        svc.create_tenant(db, seeded_org.id, make_payload(code="T2", email="t2@example.com"))
        # Org 2 tenant
        svc.create_tenant(db, seeded_org_two.id, make_payload(code="T3", email="t3@example.com"))

        res = svc.list_tenants(db, seeded_org.id, TenantFilter())
        assert res.total == 2
        assert len(res.items) == 2
        assert {item.code for item in res.items} == {"T1", "T2"}
