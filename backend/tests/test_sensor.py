"""
tests/test_sensor.py

Unit tests for the Sensor module – service layer.

Strategy
--------
Tests run against an **in-memory SQLite** database.
We seed organizations, tenants, projects, gateways, and devices as parents.
"""

import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker

from app.core.constants import DataType
from app.database.base import Base
from app.modules.devices.models.device import Device
from app.modules.gateways.models.gateway import Gateway
from app.modules.organizations.models.organization import Organization
from app.modules.projects.models.project import Project
from app.modules.sensors.schemas.sensor import (
    SensorCreate,
    SensorFilter,
    SensorUpdate,
)
from app.modules.sensors.services.sensor_service import SensorService
from app.modules.tenants.models.tenant import Tenant
from app.shared.exceptions.sensor import (
    SensorCodeTaken,
    SensorNotFound,
)
from app.shared.iot import MeasurementUnit, SensorType


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
def svc() -> SensorService:
    """Return a fresh SensorService for each test."""
    return SensorService()


@pytest.fixture()
def seeded_device(db) -> Device:
    """Seed hierarchy up to Device."""
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

    device = Device(
        gateway_id=gw.id,
        code="DEV01",
        name="Test Device",
        status="ACTIVE"
    )
    db.add(device)
    db.commit()
    db.refresh(device)
    return device


@pytest.fixture()
def seeded_device_two(db, seeded_device) -> Device:
    """Seed a second Device to test device scoping."""
    gw = db.query(Gateway).first()
    device = Device(
        gateway_id=gw.id,
        code="DEV02",
        name="Second Device",
        status="ACTIVE"
    )
    db.add(device)
    db.commit()
    db.refresh(device)
    return device


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def make_payload(**overrides) -> SensorCreate:
    """Return a valid SensorCreate payload with optional field overrides."""
    defaults = {
        "code": "TEMP",
        "name": "Temperature Sensor",
        "sensor_type": SensorType.TEMPERATURE,
        "unit": MeasurementUnit.CELSIUS,
        "data_type": DataType.NUMBER,
        "min_value": -40.0,
        "max_value": 125.0,
        "default_value": "25.0",
        "sampling_interval": 5,
        "calibration_offset": 0.2,
        "calibration_scale": 1.0,
        "status": "ACTIVE",
    }
    defaults.update(overrides)
    return SensorCreate(**defaults)


# ---------------------------------------------------------------------------
# Create Sensor Tests
# ---------------------------------------------------------------------------

class TestCreateSensor:

    def test_create_success(self, db, svc, seeded_device):
        """Happy path: sensor is created and linked correctly."""
        payload = make_payload()
        sensor = svc.create_sensor(db, seeded_device.id, payload)

        assert sensor.id is not None
        assert sensor.device_id == seeded_device.id
        assert sensor.code == "TEMP"
        assert sensor.name == "Temperature Sensor"
        assert sensor.sensor_type == SensorType.TEMPERATURE
        assert sensor.unit == MeasurementUnit.CELSIUS
        assert sensor.min_value == -40.0
        assert sensor.calibration_offset == 0.2
        assert sensor.status == "ACTIVE"
        assert sensor.is_active is True

    def test_create_duplicate_code_same_device_raises(self, db, svc, seeded_device):
        """Creating duplicate codes in the same device must raise SensorCodeTaken."""
        svc.create_sensor(db, seeded_device.id, make_payload(code="TEMP"))

        with pytest.raises(SensorCodeTaken):
            svc.create_sensor(db, seeded_device.id, make_payload(code="TEMP"))

    def test_create_duplicate_code_diff_device_allowed(self, db, svc, seeded_device, seeded_device_two):
        """Creating duplicate codes in different devices is allowed."""
        s1 = svc.create_sensor(db, seeded_device.id, make_payload(code="TEMP"))
        s2 = svc.create_sensor(db, seeded_device_two.id, make_payload(code="TEMP"))

        assert s1.id != s2.id
        assert s1.code == s2.code


# ---------------------------------------------------------------------------
# Get Sensor Tests
# ---------------------------------------------------------------------------

class TestGetSensor:

    def test_get_sensor_found(self, db, svc, seeded_device):
        """Fetch sensor by UUID works."""
        created = svc.create_sensor(db, seeded_device.id, make_payload())
        found = svc.get_sensor(db, created.id)

        assert found.id == created.id
        assert found.code == "TEMP"

    def test_get_sensor_not_found_raises(self, db, svc):
        """get_sensor raises SensorNotFound for non-existent ID."""
        with pytest.raises(SensorNotFound):
            svc.get_sensor(db, "non-existent-id-0000")

    def test_get_sensor_by_code(self, db, svc, seeded_device):
        """Fetch sensor by device and code works."""
        created = svc.create_sensor(db, seeded_device.id, make_payload())
        found = svc.get_sensor_by_code(db, seeded_device.id, "TEMP")

        assert found.id == created.id


# ---------------------------------------------------------------------------
# Update Sensor Tests
# ---------------------------------------------------------------------------

class TestUpdateSensor:

    def test_update_sensor_name_and_calibration(self, db, svc, seeded_device):
        """Only the provided fields are updated."""
        sensor = svc.create_sensor(db, seeded_device.id, make_payload())
        updated = svc.update_sensor(
            db,
            sensor.id,
            SensorUpdate(name="Calibrated Temp", calibration_offset=0.1)
        )

        assert updated.name == "Calibrated Temp"
        assert updated.calibration_offset == 0.1
        assert updated.code == "TEMP"


# ---------------------------------------------------------------------------
# Delete Sensor Tests
# ---------------------------------------------------------------------------

class TestDeleteSensor:

    def test_deactivate_sensor_soft(self, db, svc, seeded_device):
        """Soft-deletes sensor by setting is_active=False and status=INACTIVE."""
        sensor = svc.create_sensor(db, seeded_device.id, make_payload())
        res = svc.deactivate_sensor(db, sensor.id)

        assert "deactivated" in res["message"].lower()

        # Re-fetch directly to verify
        fetched = svc.get_sensor(db, sensor.id)
        assert fetched.is_active is False
        assert fetched.status == "INACTIVE"


# ---------------------------------------------------------------------------
# List Sensor Tests
# ---------------------------------------------------------------------------

class TestListSensors:

    def test_list_by_device(self, db, svc, seeded_device, seeded_device_two):
        """Listing only returns sensors from the specified device."""
        svc.create_sensor(db, seeded_device.id, make_payload(code="S1", sensor_type=SensorType.TEMPERATURE))
        svc.create_sensor(db, seeded_device.id, make_payload(code="S2", sensor_type=SensorType.HUMIDITY))
        svc.create_sensor(db, seeded_device_two.id, make_payload(code="S3", sensor_type=SensorType.TEMPERATURE))

        # Test list by device
        res = svc.list_sensors(db, seeded_device.id, SensorFilter())
        assert res.total == 2
        assert len(res.items) == 2
        assert {item.code for item in res.items} == {"S1", "S2"}

        # Test filtering by sensor type
        res_type = svc.list_sensors(db, seeded_device.id, SensorFilter(sensor_type=SensorType.HUMIDITY))
        assert res_type.total == 1
        assert res_type.items[0].code == "S2"
