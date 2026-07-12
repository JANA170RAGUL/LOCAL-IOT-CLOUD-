"""
tests/test_rule.py

Unit tests for the Rule Engine module.
"""

from unittest.mock import MagicMock, patch
import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker

from app.database.base import Base
from app.modules.organizations.models.organization import Organization
from app.modules.tenants.models.tenant import Tenant
from app.modules.projects.models.project import Project
from app.modules.devices.models.device import Device
from app.modules.gateways.models.gateway import Gateway
from app.modules.sensors.models.sensor import Sensor
from app.modules.rules.models.rule import Rule
from app.modules.rules.schemas.rule import (
    RuleCreate,
    RuleFilter,
    RuleUpdate,
)
from app.modules.rules.services.rule_service import RuleService
from app.modules.rules.engine.evaluator import RuleEvaluator
from app.modules.rules.engine.cooldown import CooldownManager
from app.modules.rules.engine.runner import RuleEngineRunner
from app.shared.exceptions.project import ProjectNotFound
from app.shared.exceptions.sensor import SensorNotFound
from app.shared.exceptions.rule import (
    RuleCodeConflict,
    RuleNotFound,
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
def svc() -> RuleService:
    """Return a fresh RuleService for each test."""
    from app.modules.rules.repositories.rule_repository import RuleRepository
    return RuleService(RuleRepository())


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
def seeded_project_two(db) -> Project:
    """Seed a second Project."""
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
# Redis In-Memory Mocking Fixture
# ---------------------------------------------------------------------------

@pytest.fixture()
def mock_redis():
    """Mock Redis client with internal memory storage."""
    client = MagicMock()
    storage = {}

    def get_val(key):
        val = storage.get(key)
        return val.encode("utf-8") if isinstance(val, str) else val

    client.get.side_effect = get_val
    client.set.side_effect = lambda k, v: storage.__setitem__(k, v)
    client.setex.side_effect = lambda k, t, v: storage.__setitem__(k, v)
    client.exists.side_effect = lambda k: k in storage

    # Patch redis getters across modules
    with patch("app.modules.rules.engine.evaluator.get_redis_client", return_value=client), \
         patch("app.modules.rules.engine.cooldown.get_redis_client", return_value=client), \
         patch("app.modules.rules.engine.runner.get_redis_client", return_value=client):
        yield client


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def make_payload(sensor_id: str, **overrides) -> RuleCreate:
    """Return a valid RuleCreate payload."""
    defaults = {
        "code": "RULE01",
        "name": "High Temp Warning",
        "description": "Trigger alert if temperature goes above 35",
        "sensor_id": sensor_id,
        "condition": ">",
        "threshold": 35.0,
        "severity": "CRITICAL",
        "enabled": True,
        "cooldown_seconds": 60,
        "action_type": "EMAIL",
        "action_config": {"recipients": ["admin@example.com"]},
    }
    defaults.update(overrides)
    return RuleCreate(**defaults)


# ---------------------------------------------------------------------------
# CRUD Tests
# ---------------------------------------------------------------------------

class TestRuleCRUD:

    def test_create_success(self, db, svc, seeded_sensor):
        payload = make_payload(seeded_sensor.id)
        rule = svc.create_rule(db, seeded_sensor.device.gateway.project_id, payload)

        assert rule.id is not None
        assert rule.project_id == seeded_sensor.device.gateway.project_id
        assert rule.sensor_id == seeded_sensor.id
        assert rule.code == "RULE01"
        assert rule.condition == ">"
        assert rule.threshold == 35.0
        assert rule.severity == "CRITICAL"
        assert rule.action_type == "EMAIL"
        assert rule.action_config == {"recipients": ["admin@example.com"]}
        assert rule.status == "ACTIVE"
        assert rule.is_active is True

    def test_create_project_not_found(self, db, svc, seeded_sensor):
        with pytest.raises(ProjectNotFound):
            svc.create_rule(db, "non-existent-proj", make_payload(seeded_sensor.id))

    def test_create_sensor_not_found(self, db, svc, seeded_sensor):
        with pytest.raises(SensorNotFound):
            svc.create_rule(db, seeded_sensor.device.gateway.project_id, make_payload("non-existent-sensor"))

    def test_create_duplicate_code_raises(self, db, svc, seeded_sensor):
        svc.create_rule(db, seeded_sensor.device.gateway.project_id, make_payload(seeded_sensor.id, code="R1"))
        with pytest.raises(RuleCodeConflict):
            svc.create_rule(db, seeded_sensor.device.gateway.project_id, make_payload(seeded_sensor.id, code="R1"))

    def test_update_rule(self, db, svc, seeded_sensor):
        rule = svc.create_rule(db, seeded_sensor.device.gateway.project_id, make_payload(seeded_sensor.id))
        updated = svc.update_rule(db, rule.id, RuleUpdate(threshold=40.0, severity="EMERGENCY"))
        assert updated.threshold == 40.0
        assert updated.severity == "EMERGENCY"

    def test_deactivate_rule(self, db, svc, seeded_sensor):
        rule = svc.create_rule(db, seeded_sensor.device.gateway.project_id, make_payload(seeded_sensor.id))
        svc.deactivate_rule(db, rule.id)

        with pytest.raises(RuleNotFound):
            svc.get_rule(db, rule.id)

        db.refresh(rule)
        assert rule.is_active is False
        assert rule.status == "INACTIVE"


# ---------------------------------------------------------------------------
# Evaluator Logic Tests
# ---------------------------------------------------------------------------

class TestRuleEvaluator:

    def test_numeric_comparisons(self, seeded_sensor):
        # Create temporary Rule objects (unsaved)
        def create_mock_rule(cond, thresh):
            return Rule(condition=cond, threshold=thresh, sensor_id=seeded_sensor.id, action_config={})

        assert RuleEvaluator.evaluate(create_mock_rule(">", 30.0), 32.5) is True
        assert RuleEvaluator.evaluate(create_mock_rule(">", 30.0), 28.0) is False

        assert RuleEvaluator.evaluate(create_mock_rule("<", 30.0), 28.0) is True
        assert RuleEvaluator.evaluate(create_mock_rule("<=", 30.0), 30.0) is True

        assert RuleEvaluator.evaluate(create_mock_rule("==", 30.0), 30.0) is True
        assert RuleEvaluator.evaluate(create_mock_rule("!=", 30.0), 31.0) is True

    def test_between_operator(self, seeded_sensor):
        rule = Rule(condition="BETWEEN", threshold=20.0, sensor_id=seeded_sensor.id, action_config={"upper_threshold": 30.0})
        assert RuleEvaluator.evaluate(rule, 25.0) is True
        assert RuleEvaluator.evaluate(rule, 15.0) is False
        assert RuleEvaluator.evaluate(rule, 35.0) is False

    def test_in_operator(self, seeded_sensor):
        rule_in = Rule(condition="IN", threshold=0.0, sensor_id=seeded_sensor.id, action_config={"list": ["ON", "RUNNING"]})
        assert RuleEvaluator.evaluate(rule_in, "RUNNING") is True
        assert RuleEvaluator.evaluate(rule_in, "OFF") is False

    def test_stateful_operators(self, seeded_sensor, mock_redis):
        rule_changed = Rule(condition="CHANGED", threshold=0.0, sensor_id=seeded_sensor.id, action_config={})
        rule_inc = Rule(condition="INCREASED", threshold=0.0, sensor_id=seeded_sensor.id, action_config={})

        # Cycle 1: No previous value exists
        assert RuleEvaluator.evaluate(rule_changed, 20.0) is False
        mock_redis.set(f"sensor:last_value:{seeded_sensor.id}", "20.0")

        # Cycle 2: Value changed
        assert RuleEvaluator.evaluate(rule_changed, 25.0) is True

        # Cycle 3: Value increased
        assert RuleEvaluator.evaluate(rule_inc, 30.0) is True
        mock_redis.set(f"sensor:last_value:{seeded_sensor.id}", "30.0")

        # Cycle 4: Value did not increase
        assert RuleEvaluator.evaluate(rule_inc, 25.0) is False


# ---------------------------------------------------------------------------
# Cooldown Logic Tests
# ---------------------------------------------------------------------------

class TestCooldownManager:

    def test_cooldown_flow(self, seeded_sensor, mock_redis):
        rule = Rule(id="rule-1", cooldown_seconds=60)

        # Initially, not in cooldown
        assert CooldownManager.is_in_cooldown(rule) is False

        # Set cooldown
        CooldownManager.set_cooldown(rule)

        # Now, must be in cooldown
        assert CooldownManager.is_in_cooldown(rule) is True


# ---------------------------------------------------------------------------
# Runner Integration Tests
# ---------------------------------------------------------------------------

class TestRuleEngineRunner:

    @patch("app.modules.rules.engine.dispatcher.ActionDispatcher.dispatch")
    def test_runner_execution(self, mock_dispatch, db, svc, seeded_sensor, mock_redis):
        # 1. Create rule
        rule = svc.create_rule(db, seeded_sensor.device.gateway.project_id, make_payload(seeded_sensor.id, threshold=30.0))

        # 2. Run runner with value below threshold (25.0)
        record_pass = {
            "sensor_id": seeded_sensor.id,
            "value": 25.0,
            "timestamp": "2026-07-12T12:00:00Z"
        }
        RuleEngineRunner.evaluate_and_trigger(db, record_pass)
        assert not mock_dispatch.called

        # 3. Run runner with value above threshold (35.0)
        record_trigger = {
            "sensor_id": seeded_sensor.id,
            "value": 35.0,
            "timestamp": "2026-07-12T12:01:00Z"
        }
        RuleEngineRunner.evaluate_and_trigger(db, record_trigger)
        assert mock_dispatch.called
        assert mock_dispatch.call_count == 1
