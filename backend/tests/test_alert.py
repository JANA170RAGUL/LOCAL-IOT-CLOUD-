"""
tests/test_alert.py

Unit tests for the Alert Engine module.
"""

from unittest.mock import MagicMock, patch
import pytest
from sqlalchemy import create_engine, select
from sqlalchemy.orm import Session, sessionmaker

from app.database.base import Base
from app.modules.organizations.models.organization import Organization
from app.modules.tenants.models.tenant import Tenant
from app.modules.projects.models.project import Project
from app.modules.devices.models.device import Device
from app.modules.gateways.models.gateway import Gateway
from app.modules.sensors.models.sensor import Sensor
from app.modules.rules.models.rule import Rule
from app.modules.rules.schemas.rule import RuleCreate
from app.modules.rules.services.rule_service import RuleService
from app.modules.rules.engine.runner import RuleEngineRunner
from app.modules.alerts.models.alert import Alert
from app.modules.alerts.schemas.alert import (
    AlertCreate,
    AlertUpdate,
    AlertFilter,
)
from app.modules.alerts.services.alert_service import AlertService
from app.shared.exceptions.project import ProjectNotFound
from app.shared.exceptions.alert import AlertNotFound


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
def svc() -> AlertService:
    """Return a fresh AlertService for each test."""
    from app.modules.alerts.repositories.alert_repository import AlertRepository
    return AlertService(AlertRepository())


@pytest.fixture()
def seeded_sensor(db) -> Sensor:
    """Seed the hierarchy up to Sensor."""
    org = Organization(
        code="ORG01",
        name="Test Org",
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

    gateway = Gateway(
        project_id=project.id,
        code="GW01",
        name="Gateway 1",
        status="ACTIVE"
    )
    db.add(gateway)
    db.commit()
    db.refresh(gateway)

    device = Device(
        gateway_id=gateway.id,
        code="DEV01",
        name="Device 1",
        status="ACTIVE"
    )
    db.add(device)
    db.commit()
    db.refresh(device)

    sensor = Sensor(
        device_id=device.id,
        code="TEMP",
        name="Temperature Sensor",
        data_type="number",
        status="ACTIVE"
    )
    db.add(sensor)
    db.commit()
    db.refresh(sensor)
    return sensor


@pytest.fixture()
def mock_redis():
    """Mock Redis client for rule evaluations."""
    client = MagicMock()
    storage = {}

    def get_val(key):
        val = storage.get(key)
        return val.encode("utf-8") if isinstance(val, str) else val

    client.get.side_effect = get_val
    client.set.side_effect = lambda k, v: storage.__setitem__(k, v)
    client.setex.side_effect = lambda k, t, v: storage.__setitem__(k, v)
    client.exists.side_effect = lambda k: k in storage

    with patch("app.modules.rules.engine.evaluator.get_redis_client", return_value=client), \
         patch("app.modules.rules.engine.cooldown.get_redis_client", return_value=client), \
         patch("app.modules.rules.engine.runner.get_redis_client", return_value=client), \
         patch("app.modules.rules.engine.dispatcher.get_redis_client", return_value=client):
        yield client


# ---------------------------------------------------------------------------
# CRUD Tests
# ---------------------------------------------------------------------------

class TestAlertCRUD:

    def test_create_alert_manually(self, db, svc, seeded_sensor):
        payload = AlertCreate(
            sensor_id=seeded_sensor.id,
            device_id=seeded_sensor.device_id,
            severity="CRITICAL",
            title="Manual System Alert",
            message="Power grid anomaly detected.",
            status="OPEN",
            acknowledged=False,
            resolved=False,
            metadata={"source": "operator"},
        )
        alert = svc.create_alert(db, payload)

        assert alert.id is not None
        assert alert.sensor_id == seeded_sensor.id
        assert alert.severity == "CRITICAL"
        assert alert.title == "Manual System Alert"
        assert alert.status == "OPEN"
        assert alert.metadata_json == {"source": "operator"}
        assert alert.is_active is True

    def test_get_alert_not_found(self, db, svc):
        with pytest.raises(AlertNotFound):
            svc.get_alert(db, "non-existent-alert")

    def test_list_alerts_by_project(self, db, svc, seeded_sensor):
        # 1. Create alert
        payload = AlertCreate(
            sensor_id=seeded_sensor.id,
            device_id=seeded_sensor.device_id,
            severity="WARNING",
            title="Low battery",
            message="Device battery below 15%",
            status="OPEN",
        )
        svc.create_alert(db, payload)

        # 2. List
        total, items = svc.list_alerts(db, seeded_sensor.device.gateway.project_id, AlertFilter(), page=1, page_size=10)
        assert total == 1
        assert items[0].title == "Low battery"

    def test_list_alerts_project_not_found(self, db, svc):
        with pytest.raises(ProjectNotFound):
            svc.list_alerts(db, "non-existent-proj", AlertFilter(), page=1, page_size=10)

    def test_deactivate_alert(self, db, svc, seeded_sensor):
        payload = AlertCreate(
            sensor_id=seeded_sensor.id,
            severity="INFO",
            title="Info Alert",
            message="Normal notification",
        )
        alert = svc.create_alert(db, payload)
        svc.deactivate_alert(db, alert.id)

        with pytest.raises(AlertNotFound):
            svc.get_alert(db, alert.id)


# ---------------------------------------------------------------------------
# Workflow Tests (Acknowledge & Resolve)
# ---------------------------------------------------------------------------

class TestAlertWorkflow:

    def test_acknowledge_alert(self, db, svc, seeded_sensor):
        payload = AlertCreate(
            sensor_id=seeded_sensor.id,
            severity="WARNING",
            title="Warning alert",
            message="Needs attention",
        )
        alert = svc.create_alert(db, payload)
        assert alert.acknowledged is False
        assert alert.status == "OPEN"

        # Acknowledge
        ack = svc.acknowledge_alert(db, alert_id=alert.id, acknowledged_by="operator-john")
        assert ack.acknowledged is True
        assert ack.acknowledged_by == "operator-john"
        assert ack.acknowledged_at is not None
        assert ack.status == "ACKNOWLEDGED"

    def test_resolve_alert(self, db, svc, seeded_sensor):
        payload = AlertCreate(
            sensor_id=seeded_sensor.id,
            severity="CRITICAL",
            title="Critical alert",
            message="Server room overheating",
        )
        alert = svc.create_alert(db, payload)
        assert alert.resolved is False

        # Resolve
        res = svc.resolve_alert(db, alert_id=alert.id)
        assert res.resolved is True
        assert res.resolved_at is not None
        assert res.status == "RESOLVED"


# ---------------------------------------------------------------------------
# Rule Engine Integration Tests
# ---------------------------------------------------------------------------

class TestRuleEngineTriggerAlert:

    def test_rule_trigger_automatically_creates_db_alert(self, db, seeded_sensor, mock_redis):
        # 1. Create rule
        from app.modules.rules.repositories.rule_repository import RuleRepository
        rule_svc = RuleService(RuleRepository())
        rule_payload = RuleCreate(
            code="TEMP_LIMIT",
            name="Temperature Limit",
            description="Create alert when temp is too high",
            sensor_id=seeded_sensor.id,
            condition=">",
            threshold=38.0,
            severity="CRITICAL",
            enabled=True,
            cooldown_seconds=60,
            action_type="CREATE_ALERT",
            action_config={},
        )
        rule_svc.create_rule(db, seeded_sensor.device.gateway.project_id, rule_payload)

        # 2. Trigger the Rule Engine using runner
        record = {
            "sensor_id": seeded_sensor.id,
            "device_id": seeded_sensor.device_id,
            "value": 42.5,
            "timestamp": "2026-07-12T13:00:00Z"
        }
        RuleEngineRunner.evaluate_and_trigger(db, record)

        # 3. Verify alert was written to the database
        alerts = db.scalars(select(Alert).where(Alert.sensor_id == seeded_sensor.id)).all()
        assert len(alerts) == 1
        alert = alerts[0]
        assert alert.severity == "CRITICAL"
        assert alert.title == "Rule Triggered: Temperature Limit"
        assert "42.5" in alert.message
        assert alert.status == "OPEN"
