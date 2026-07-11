"""
tests/test_gateway.py

Unit tests for the Gateway module – service layer.

Strategy
--------
Tests run against an **in-memory SQLite** database.
We seed organizations, tenants, and projects as parents.
"""

import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker

from app.database.base import Base
from app.modules.gateways.schemas.gateway import (
    GatewayCreate,
    GatewayFilter,
    GatewayUpdate,
)
from app.modules.gateways.services.gateway_service import GatewayService
from app.modules.organizations.models.organization import Organization
from app.modules.projects.models.project import Project
from app.modules.tenants.models.tenant import Tenant
from app.shared.exceptions.gateway import (
    GatewayCodeTaken,
    GatewayNotFound,
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
def svc() -> GatewayService:
    """Return a fresh GatewayService for each test."""
    return GatewayService()


@pytest.fixture()
def seeded_project(db) -> Project:
    """Seed hierarchy up to Project."""
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

    proj = Project(
        tenant_id=tenant.id,
        code="PROJ01",
        name="Test Project",
        status="ACTIVE"
    )
    db.add(proj)
    db.commit()
    db.refresh(proj)
    return proj


@pytest.fixture()
def seeded_project_two(db, seeded_project) -> Project:
    """Seed a second Project to test project scoping."""
    # Re-use tenant
    tenant = db.query(Tenant).first()
    proj = Project(
        tenant_id=tenant.id,
        code="PROJ02",
        name="Second Project",
        status="ACTIVE"
    )
    db.add(proj)
    db.commit()
    db.refresh(proj)
    return proj


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def make_payload(**overrides) -> GatewayCreate:
    """Return a valid GatewayCreate payload with optional field overrides."""
    defaults = {
        "code": "GW01",
        "name": "Edge Gateway 01",
        "description": "Lab edge gateway",
        "location": "Lab Rack 1",
        "ip_address": "192.168.1.100",
        "mac_address": "AA:BB:CC:DD:EE:FF",
        "firmware_version": "v1.0.0",
        "protocol": "MQTT",
        "mqtt_topic": "gateways/gw01",
        "status": "ACTIVE",
    }
    defaults.update(overrides)
    return GatewayCreate(**defaults)


# ---------------------------------------------------------------------------
# Create Gateway Tests
# ---------------------------------------------------------------------------

class TestCreateGateway:

    def test_create_success(self, db, svc, seeded_project):
        """Happy path: gateway is created and linked correctly."""
        payload = make_payload()
        gateway = svc.create_gateway(db, seeded_project.id, payload)

        assert gateway.id is not None
        assert gateway.project_id == seeded_project.id
        assert gateway.code == "GW01"
        assert gateway.name == "Edge Gateway 01"
        assert gateway.mac_address == "AA:BB:CC:DD:EE:FF"
        assert gateway.protocol == "MQTT"
        assert gateway.status == "ACTIVE"
        assert gateway.is_active is True

    def test_create_duplicate_code_same_project_raises(self, db, svc, seeded_project):
        """Creating duplicate codes in the same project must raise GatewayCodeTaken."""
        svc.create_gateway(db, seeded_project.id, make_payload(code="GW01"))

        with pytest.raises(GatewayCodeTaken):
            svc.create_gateway(db, seeded_project.id, make_payload(code="GW01"))

    def test_create_duplicate_code_diff_project_allowed(self, db, svc, seeded_project, seeded_project_two):
        """Creating duplicate codes in different projects is allowed."""
        g1 = svc.create_gateway(db, seeded_project.id, make_payload(code="GW01"))
        g2 = svc.create_gateway(db, seeded_project_two.id, make_payload(code="GW01"))

        assert g1.id != g2.id
        assert g1.code == g2.code


# ---------------------------------------------------------------------------
# Get Gateway Tests
# ---------------------------------------------------------------------------

class TestGetGateway:

    def test_get_gateway_found(self, db, svc, seeded_project):
        """Fetch gateway by UUID works."""
        created = svc.create_gateway(db, seeded_project.id, make_payload())
        found = svc.get_gateway(db, created.id)

        assert found.id == created.id
        assert found.code == "GW01"

    def test_get_gateway_not_found_raises(self, db, svc):
        """get_gateway raises GatewayNotFound for non-existent ID."""
        with pytest.raises(GatewayNotFound):
            svc.get_gateway(db, "non-existent-id-0000")

    def test_get_gateway_by_code(self, db, svc, seeded_project):
        """Fetch gateway by project and code works."""
        created = svc.create_gateway(db, seeded_project.id, make_payload())
        found = svc.get_gateway_by_code(db, seeded_project.id, "GW01")

        assert found.id == created.id


# ---------------------------------------------------------------------------
# Update Gateway Tests
# ---------------------------------------------------------------------------

class TestUpdateGateway:

    def test_update_gateway_name_and_ip(self, db, svc, seeded_project):
        """Only the provided fields are updated."""
        gateway = svc.create_gateway(db, seeded_project.id, make_payload())
        updated = svc.update_gateway(
            db,
            gateway.id,
            GatewayUpdate(name="Updated Gateway Name", ip_address="192.168.1.150")
        )

        assert updated.name == "Updated Gateway Name"
        assert updated.ip_address == "192.168.1.150"
        assert updated.code == "GW01"


# ---------------------------------------------------------------------------
# Delete Gateway Tests
# ---------------------------------------------------------------------------

class TestDeleteGateway:

    def test_deactivate_gateway_soft(self, db, svc, seeded_project):
        """Soft-deletes gateway by setting is_active=False and status=INACTIVE."""
        gateway = svc.create_gateway(db, seeded_project.id, make_payload())
        res = svc.deactivate_gateway(db, gateway.id)

        assert "deactivated" in res["message"].lower()

        # Re-fetch directly to verify
        fetched = svc.get_gateway(db, gateway.id)
        assert fetched.is_active is False
        assert fetched.status == "INACTIVE"


# ---------------------------------------------------------------------------
# List Gateway Tests
# ---------------------------------------------------------------------------

class TestListGateways:

    def test_list_by_project(self, db, svc, seeded_project, seeded_project_two):
        """Listing only returns gateways from the specified project."""
        svc.create_gateway(db, seeded_project.id, make_payload(code="G1", protocol="MQTT"))
        svc.create_gateway(db, seeded_project.id, make_payload(code="G2", protocol="HTTP"))
        svc.create_gateway(db, seeded_project_two.id, make_payload(code="G3", protocol="MQTT"))

        # Test list by project
        res = svc.list_gateways(db, seeded_project.id, GatewayFilter())
        assert res.total == 2
        assert len(res.items) == 2
        assert {item.code for item in res.items} == {"G1", "G2"}

        # Test filtering by protocol
        res_protocol = svc.list_gateways(db, seeded_project.id, GatewayFilter(protocol="HTTP"))
        assert res_protocol.total == 1
        assert res_protocol.items[0].code == "G2"
