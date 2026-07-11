"""
tests/test_telemetry.py

Unit tests for the Telemetry engine module.
Uses in-memory SQLite for SQL lookups and mocks Redis/InfluxDB dependencies.
"""

from datetime import datetime, timezone
from unittest.mock import MagicMock, patch

import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker

from app.database.base import Base
from app.modules.devices.models.device import Device
from app.modules.gateways.models.gateway import Gateway
from app.modules.organizations.models.organization import Organization
from app.modules.projects.models.project import Project
from app.modules.sensors.models.sensor import Sensor
from app.modules.telemetry.services.influx_writer import InfluxWriter
from app.modules.telemetry.services.payload_validator import PayloadValidator
from app.modules.telemetry.services.processing_engine import ProcessingEngine
from app.modules.telemetry.services.queue_manager import QueueManager
from app.modules.telemetry.services.sensor_resolver import SensorResolver
from app.modules.tenants.models.tenant import Tenant
from app.shared.iot import MeasurementUnit, SensorType

# ---------------------------------------------------------------------------
# Database Fixtures
# ---------------------------------------------------------------------------

@pytest.fixture(scope="session")
def engine():
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
    connection = engine.connect()
    transaction = connection.begin()

    TestSession = sessionmaker(bind=connection, autocommit=False, autoflush=False)
    session = TestSession()

    yield session

    session.close()
    transaction.rollback()
    connection.close()


@pytest.fixture()
def seeded_sensor(db) -> Sensor:
    """Seed parent hierarchy up to a Sensor."""
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
        code="ESP32_01",
        name="ESP32 Ingestion Device",
        status="ACTIVE"
    )
    db.add(device)
    db.commit()
    db.refresh(device)

    sensor = Sensor(
        device_id=device.id,
        code="TEMP",
        name="Temperature Sensor",
        sensor_type=SensorType.TEMPERATURE,
        unit=MeasurementUnit.CELSIUS,
        data_type="number",
        min_value=-40.0,
        max_value=120.0,
        calibration_offset=2.0,  # add 2
        calibration_scale=1.5,   # scale by 1.5
        status="ACTIVE"
    )
    db.add(sensor)
    db.commit()
    db.refresh(sensor)
    return sensor


# ---------------------------------------------------------------------------
# Test Payload Ingestion & Validation
# ---------------------------------------------------------------------------

class TestPayloadValidator:

    def test_validation_success(self):
        payload = {
            "device": "ESP32_01",
            "sensor": "TEMP",
            "value": 25.5,
            "timestamp": "2026-07-12T12:00:00Z"
        }
        res = PayloadValidator.validate(payload)
        assert res["device"] == "ESP32_01"
        assert res["sensor"] == "TEMP"
        assert res["value"] == 25.5
        assert res["timestamp"] == "2026-07-12T12:00:00Z"

    def test_validation_missing_fields_raises(self):
        payload = {
            "sensor": "TEMP",
            "value": 25.5
        }
        with pytest.raises(ValueError, match="Invalid telemetry payload"):
            PayloadValidator.validate(payload)


# ---------------------------------------------------------------------------
# Test SQL Entity Resolver
# ---------------------------------------------------------------------------

class TestSensorResolver:

    def test_resolve_by_uuid_success(self, db, seeded_sensor):
        device = db.query(Device).first()
        sensor = db.query(Sensor).first()

        resolved_dev, resolved_sens = SensorResolver.resolve(
            db,
            device_str=device.id,
            sensor_code="TEMP",
        )
        assert resolved_dev.id == device.id
        assert resolved_sens.id == sensor.id

    def test_resolve_by_code_with_gateway_success(self, db, seeded_sensor):
        device = db.query(Device).first()
        gateway = db.query(Gateway).first()

        resolved_dev, resolved_sens = SensorResolver.resolve(
            db,
            device_str="ESP32_01",
            sensor_code="TEMP",
            gateway_str=gateway.code,
        )
        assert resolved_dev.id == device.id

    def test_resolve_not_found_raises(self, db, seeded_sensor):
        with pytest.raises(ValueError, match="Device not found"):
            SensorResolver.resolve(db, "non-existent-device", "TEMP")


# ---------------------------------------------------------------------------
# Test Ingestion Processing Engine (Calibration & Boundaries)
# ---------------------------------------------------------------------------

class TestProcessingEngine:

    def test_calibration_and_mysql_timestamp_updates(self, db, seeded_sensor):
        device = db.query(Device).first()
        sensor = db.query(Sensor).first()

        raw_payload = {
            "device": device.id,
            "sensor": "TEMP",
            "value": 10.0,  # Calibrated: (10 * 1.5) + 2 = 17.0
            "timestamp": "2026-07-12T12:00:00Z"
        }

        processed = ProcessingEngine.process(db, raw_payload)

        # Verify calibration calculation
        assert processed["raw_value"] == 10.0
        assert processed["value"] == 17.0
        assert processed["device_id"] == device.id
        assert processed["sensor_type"] == SensorType.TEMPERATURE

        # Verify MySQL updates
        db.refresh(device)
        db.refresh(sensor)
        assert device.last_seen is not None
        assert sensor.last_reading_at is not None


# ---------------------------------------------------------------------------
# Test Redis Ingestion Queue buffering
# ---------------------------------------------------------------------------

class TestQueueManager:

    @patch("app.modules.telemetry.services.queue_manager.get_redis_client")
    def test_enqueue_and_dequeue(self, mock_get_redis):
        # Mock Redis client using simple list storage mock
        mock_redis = MagicMock()
        mock_get_redis.return_value = mock_redis

        mock_queue = []
        mock_redis.rpush.side_effect = lambda key, val: mock_queue.append(val)
        mock_redis.llen.side_effect = lambda key: len(mock_queue)

        # Dequeue uses a pipeline logic
        mock_pipeline = MagicMock()
        mock_redis.pipeline.return_value = mock_pipeline

        def execute_side_effect():
            res = mock_queue[:100]
            del mock_queue[:100]
            return res

        mock_pipeline.execute.side_effect = execute_side_effect

        payload = {"device": "D01", "sensor": "T", "value": 20.0}
        QueueManager.enqueue(payload)

        assert len(mock_queue) == 1

        dequeued = QueueManager.dequeue_batch(batch_size=10)
        assert len(dequeued) == 1
        assert dequeued[0]["device"] == "D01"


# ---------------------------------------------------------------------------
# Test InfluxDB point generator
# ---------------------------------------------------------------------------

class TestInfluxWriter:

    @patch("app.modules.telemetry.services.influx_writer.write_api")
    def test_write_batch(self, mock_write_api):
        records = [
            {
                "device_id": "device-uuid-1",
                "gateway_id": "gateway-uuid-1",
                "sensor_code": "TEMP",
                "sensor_type": "TEMPERATURE",
                "raw_value": 20.0,
                "value": 32.0,
                "timestamp": datetime.now(timezone.utc),
            }
        ]

        # Should execute successfully without raising exceptions
        InfluxWriter.write_batch(records)
        assert mock_write_api.write.called
