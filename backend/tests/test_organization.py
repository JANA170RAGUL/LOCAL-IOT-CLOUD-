"""
tests/test_organization.py

Unit tests for the Organization module – service layer.

Strategy
--------
Tests run against an **in-memory SQLite** database using SQLAlchemy's
`create_engine("sqlite:///:memory:")`.  No MySQL / Docker required.

Each test function gets a fresh, isolated database session via the
`db` fixture so tests are fully independent and can run in any order.

Coverage
--------
- Create (happy path)
- Create duplicate code  → OrganizationCodeTaken
- Create duplicate email → OrganizationEmailTaken
- Get by ID (found)
- Get by ID (not found)  → OrganizationNotFound
- Update (patch fields)
- Update email conflict   → OrganizationEmailTaken
- Delete (soft-delete)    → is_active=False, status=INACTIVE
- List (pagination + search + status filter)
"""

import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session

from app.database.base import Base
from app.modules.organizations.models.organization import Organization  # noqa: F401  (registers table)
from app.modules.organizations.schemas.organization import (
    OrganizationCreate,
    OrganizationFilter,
    OrganizationUpdate,
)
from app.modules.organizations.services.organization_service import OrganizationService
from app.shared.exceptions.organization import (
    OrganizationCodeTaken,
    OrganizationEmailTaken,
    OrganizationNotFound,
)


# ---------------------------------------------------------------------------
# Fixtures
# ---------------------------------------------------------------------------

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
    """
    Provide a fresh, rolled-back database session per test.

    Uses a nested transaction (SAVEPOINT) so each test is isolated
    without recreating the schema.
    """
    connection = engine.connect()
    transaction = connection.begin()

    TestSession = sessionmaker(bind=connection, autocommit=False, autoflush=False)
    session = TestSession()

    yield session

    session.close()
    transaction.rollback()
    connection.close()


@pytest.fixture()
def svc() -> OrganizationService:
    """Return a fresh OrganizationService for each test."""
    return OrganizationService()


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def make_payload(**overrides) -> OrganizationCreate:
    """Return a valid OrganizationCreate payload with optional field overrides."""
    defaults = {
        "code": "VELTECH",
        "name": "Vel Tech University",
        "email": "admin@veltech.edu.in",
        "license_type": "Academic",
        "status": "ACTIVE",
    }
    defaults.update(overrides)
    return OrganizationCreate(**defaults)


# ---------------------------------------------------------------------------
# Create
# ---------------------------------------------------------------------------

class TestCreateOrganization:

    def test_create_success(self, db, svc):
        """Happy path: new org is persisted and returned with correct fields."""
        payload = make_payload(license_type="Professional")

        org = svc.create(db, payload)

        assert org.id is not None
        assert org.code == "VELTECH"
        assert org.name == "Vel Tech University"
        assert org.email == "admin@veltech.edu.in"
        assert org.license_type == "Professional"   # ← must NOT fall back to "Community"
        assert org.status == "ACTIVE"
        assert org.is_active is True

    def test_create_duplicate_code_raises(self, db, svc):
        """Creating two orgs with the same code must raise OrganizationCodeTaken."""
        svc.create(db, make_payload(email="first@example.com"))

        with pytest.raises(OrganizationCodeTaken):
            svc.create(db, make_payload(email="second@example.com"))

    def test_create_duplicate_email_raises(self, db, svc):
        """Creating two orgs with the same email must raise OrganizationEmailTaken."""
        svc.create(db, make_payload(code="ORG001"))

        with pytest.raises(OrganizationEmailTaken):
            svc.create(db, make_payload(code="ORG002"))

    def test_create_license_type_persisted(self, db, svc):
        """
        Regression test for the license_type bug.
        The value from the request must be saved, not the column default.
        """
        for tier in ("Community", "Professional", "Enterprise", "Academic"):
            payload = make_payload(
                code=f"ORG-{tier[:3].upper()}",
                email=f"{tier.lower()}@example.com",
                license_type=tier,
            )
            org = svc.create(db, payload)
            assert org.license_type == tier, (
                f"Expected license_type='{tier}' but got '{org.license_type}'. "
                "ORM likely fell back to the column default."
            )


# ---------------------------------------------------------------------------
# Get by ID
# ---------------------------------------------------------------------------

class TestGetOrganization:

    def test_get_by_id_found(self, db, svc):
        """get_by_id returns the correct organization."""
        created = svc.create(db, make_payload())

        found = svc.get_by_id(db, created.id)

        assert found.id == created.id
        assert found.code == "VELTECH"

    def test_get_by_id_not_found_raises(self, db, svc):
        """get_by_id raises OrganizationNotFound for an unknown ID."""
        with pytest.raises(OrganizationNotFound):
            svc.get_by_id(db, "non-existent-id-0000")


# ---------------------------------------------------------------------------
# Update
# ---------------------------------------------------------------------------

class TestUpdateOrganization:

    def test_update_name(self, db, svc):
        """Only the supplied field is changed; everything else is untouched."""
        org = svc.create(db, make_payload())

        updated = svc.update(db, org.id, OrganizationUpdate(name="Vel Tech Ranipet"))

        assert updated.name == "Vel Tech Ranipet"
        assert updated.code == "VELTECH"          # unchanged
        assert updated.email == "admin@veltech.edu.in"  # unchanged

    def test_update_license_type(self, db, svc):
        """License tier can be upgraded via update."""
        org = svc.create(db, make_payload(license_type="Community"))

        updated = svc.update(db, org.id, OrganizationUpdate(license_type="Enterprise"))

        assert updated.license_type == "Enterprise"

    def test_update_status(self, db, svc):
        """Status can be changed to SUSPENDED via update."""
        org = svc.create(db, make_payload())

        updated = svc.update(db, org.id, OrganizationUpdate(status="SUSPENDED"))

        assert updated.status == "SUSPENDED"

    def test_update_email_conflict_raises(self, db, svc):
        """Changing email to one already owned by another org raises OrganizationEmailTaken."""
        org_a = svc.create(db, make_payload(code="ORGA", email="orga@example.com"))
        svc.create(db, make_payload(code="ORGB", email="orgb@example.com"))

        with pytest.raises(OrganizationEmailTaken):
            svc.update(db, org_a.id, OrganizationUpdate(email="orgb@example.com"))

    def test_update_same_email_allowed(self, db, svc):
        """Updating with the org's own email must not raise a conflict."""
        org = svc.create(db, make_payload())

        updated = svc.update(db, org.id, OrganizationUpdate(email="admin@veltech.edu.in"))

        assert updated.email == "admin@veltech.edu.in"


# ---------------------------------------------------------------------------
# Delete (soft)
# ---------------------------------------------------------------------------

class TestDeleteOrganization:

    def test_delete_soft(self, db, svc):
        """
        Delete sets is_active=False and status=INACTIVE.
        The record still exists in the database.
        """
        org = svc.create(db, make_payload())

        result = svc.delete(db, org.id)

        assert "deactivated" in result["message"].lower()

        # Re-fetch directly to confirm the row still exists
        fetched = svc.get_by_id(db, org.id)
        assert fetched.is_active is False
        assert fetched.status == "INACTIVE"

    def test_delete_not_found_raises(self, db, svc):
        """Deleting a non-existent org raises OrganizationNotFound."""
        with pytest.raises(OrganizationNotFound):
            svc.delete(db, "ghost-id-999")


# ---------------------------------------------------------------------------
# List
# ---------------------------------------------------------------------------

class TestListOrganizations:

    def _seed(self, db, svc):
        """Create 3 orgs with different statuses for filter tests."""
        svc.create(db, make_payload(code="ALPHA", email="alpha@x.com", status="ACTIVE"))
        svc.create(db, make_payload(code="BETA",  email="beta@x.com",  status="TRIAL"))
        svc.create(db, make_payload(code="GAMMA", email="gamma@x.com", status="SUSPENDED"))

    def test_list_all(self, db, svc):
        """List without filters returns all organizations."""
        self._seed(db, svc)

        result = svc.list(db, OrganizationFilter())

        assert result.total == 3
        assert len(result.items) == 3

    def test_list_filter_by_status(self, db, svc):
        """Filtering by status returns only matching organizations."""
        self._seed(db, svc)

        result = svc.list(db, OrganizationFilter(status="TRIAL"))

        assert result.total == 1
        assert result.items[0].code == "BETA"

    def test_list_search_by_code(self, db, svc):
        """Keyword search matches on code."""
        self._seed(db, svc)

        result = svc.list(db, OrganizationFilter(search="ALPHA"))

        assert result.total == 1
        assert result.items[0].code == "ALPHA"

    def test_list_pagination(self, db, svc):
        """page_size is respected and total_pages is calculated correctly."""
        self._seed(db, svc)

        result = svc.list(db, OrganizationFilter(page=1, page_size=2))

        assert len(result.items) == 2
        assert result.total == 3
        assert result.total_pages == 2
