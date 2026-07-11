"""
tests/test_device.py

Unit tests for the Device module – service layer.

Strategy
--------
Tests run against an **in-memory SQLite** database.
We seed organizations, tenants, projects, and gateways as parents.
"""

import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker

from app.database.base import Base
from app.modules.devices.schemas.device import (
    DeviceCreate,
    DeviceFilter,
    DeviceUpdate,
)
from app.modules.devices.services.device_service import DeviceService
from app.modules.gateways.models.gateway import Gateway
from app.modules.organizations.models.organization import Organization
from app.modules.projects.models.project import Project
from app.modules.tenants.models.tenant import Tenant
from app.shared.exceptions.device import (
    DeviceCodeTaken,
    DeviceNotFound,
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
def svc() -> DeviceService:
    """Return a fresh DeviceService for each test."""
    return DeviceService()


@pytest.fixture()
def seeded_gateway(db) -> Gateway:
    """Seed hierarchy up to Gateway."""
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

    gw = Gateway(
        project_id=proj.id,
        code="GW01",
        name="Test Gateway",
        status="ACTIVE"
    )
    db.add(gw)
    db.commit()
    db.refresh(gw)
    return gw


@pytest.fixture()
def seeded_gateway_two(db, seeded_gateway) -> Gateway:
    """Seed a second Gateway to test gateway scoping."""
    proj = db.query(Project).first()
    gw = Gateway(
        project_id=proj.id,
        code="GW02",
        name="Second Gateway",
        status="ACTIVE"
    )
    db.add(gw)
    db.commit()
    db.refresh(gw)
    return gw


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def make_payload(**overrides) -> DeviceCreate:
    """Return a valid DeviceCreate payload with optional field overrides."""
    defaults = {
        "code": "DEV01",
        "name": "Node ESP32",
        "description": "ESP32 micro-controller",
        "device_type": "sensor_node",
        "manufacturer": "Espressif",
        "model": "ESP32-WROOM-32D",
        "serial_number": "ESP-32-00123",
        "firmware_version": "v1.2.3",
        "hardware_version": "v2.0",
        "mac_address": "11:22:33:44:55:66",
        "ip_address": "192.168.1.50",
        "status": "ACTIVE",
    }
    defaults.update(overrides)
    return DeviceCreate(**defaults)


# ---------------------------------------------------------------------------
# Create Device Tests
# ---------------------------------------------------------------------------

class TestCreateDevice:

    def test_create_success(self, db, svc, seeded_gateway):
        """Happy path: device is created and linked correctly."""
        payload = make_payload()
        device = svc.create_device(db, seeded_gateway.id, payload)

        assert device.id is not None
        assert device.gateway_id == seeded_gateway.id
        assert device.code == "DEV01"
        assert device.name == "Node ESP32"
        assert device.mac_address == "11:22:33:44:55:66"
        assert device.device_type == "sensor_node"
        assert device.status == "ACTIVE"
        assert device.is_active is True

    def test_create_duplicate_code_same_gateway_raises(self, db, svc, seeded_gateway):
        """Creating duplicate codes in the same gateway must raise DeviceCodeTaken."""
        svc.create_device(db, seeded_gateway.id, make_payload(code="DEV01"))

        with pytest.raises(DeviceCodeTaken):
            svc.create_device(db, seeded_gateway.id, make_payload(code="DEV01"))

    def test_create_duplicate_code_diff_gateway_allowed(self, db, svc, seeded_gateway, seeded_gateway_two):
        """Creating duplicate codes in different gateways is allowed."""
        d1 = svc.create_device(db, seeded_gateway.id, make_payload(code="DEV01"))
        d2 = svc.create_device(db, seeded_gateway_two.id, make_payload(code="DEV01"))

        assert d1.id != d2.id
        assert d1.code == d2.code


# ---------------------------------------------------------------------------
# Get Device Tests
# ---------------------------------------------------------------------------

class TestGetDevice:

    def test_get_device_found(self, db, svc, seeded_gateway):
        """Fetch device by UUID works."""
        created = svc.create_device(db, seeded_gateway.id, make_payload())
        found = svc.get_device(db, created.id)

        assert found.id == created.id
        assert found.code == "DEV01"

    def test_get_device_not_found_raises(self, db, svc):
        """get_device raises DeviceNotFound for non-existent ID."""
        with pytest.raises(DeviceNotFound):
            svc.get_device(db, "non-existent-id-0000")

    def test_get_device_by_code(self, db, svc, seeded_gateway):
        """Fetch device by gateway and code works."""
        created = svc.create_device(db, seeded_gateway.id, make_payload())
        found = svc.get_device_by_code(db, seeded_gateway.id, "DEV01")

        assert found.id == created.id


# ---------------------------------------------------------------------------
# Update Device Tests
# ---------------------------------------------------------------------------

class TestUpdateDevice:

    def test_update_device_name_and_model(self, db, svc, seeded_gateway):
        """Only the provided fields are updated."""
        device = svc.create_device(db, seeded_gateway.id, make_payload())
        updated = svc.update_device(
            db,
            device.id,
            DeviceUpdate(name="New Node Name", model="ESP32-S3")
        )

        assert updated.name == "New Node Name"
        assert updated.model == "ESP32-S3"
        assert updated.code == "DEV01"


# ---------------------------------------------------------------------------
# Delete Device Tests
# ---------------------------------------------------------------------------

class TestDeleteDevice:

    def test_deactivate_device_soft(self, db, svc, seeded_gateway):
        """Soft-deletes device by setting is_active=False and status=INACTIVE."""
        device = svc.create_device(db, seeded_gateway.id, make_payload())
        res = svc.deactivate_device(db, device.id)

        assert "deactivated" in res["message"].lower()

        # Re-fetch directly to verify
        fetched = svc.get_device(db, device.id)
        assert fetched.is_active is False
        assert fetched.status == "INACTIVE"


# ---------------------------------------------------------------------------
# List Device Tests
# ---------------------------------------------------------------------------

class TestListDevices:

    def test_list_by_gateway(self, db, svc, seeded_gateway, seeded_gateway_two):
        """Listing only returns devices from the specified gateway."""
        svc.create_device(db, seeded_gateway.id, make_payload(code="D1", device_type="node"))
        svc.create_device(db, seeded_gateway.id, make_payload(code="D2", device_type="relay"))
        svc.create_device(db, seeded_gateway_two.id, make_payload(code="D3", device_type="node"))

        # Test list by gateway
        res = svc.list_devices(db, seeded_gateway.id, DeviceFilter())
        assert res.total == 2
        assert len(res.items) == 2
        assert {item.code for item in res.items} == {"D1", "D2"}

        # Test filtering by device type
        res_type = svc.list_devices(db, seeded_gateway.id, DeviceFilter(device_type="relay"))
        assert res_type.total == 1
        assert res_type.items[0].code == "D2"
