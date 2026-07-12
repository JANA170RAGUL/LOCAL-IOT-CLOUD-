"""
tests/conftest.py

SQLAlchemy mapper pre-loading configurations.
Imports all models to register them on the metadata registry before running pytest.
"""

from app.modules.devices.models.device import Device  # noqa: F401
from app.modules.gateways.models.gateway import Gateway  # noqa: F401
from app.modules.organizations.models.organization import Organization  # noqa: F401
from app.modules.projects.models.project import Project  # noqa: F401
from app.modules.sensors.models.sensor import Sensor  # noqa: F401
from app.modules.tenants.models.tenant import Tenant  # noqa: F401
from app.modules.dashboards.models.dashboard import Dashboard  # noqa: F401
from app.modules.widgets.models.widget import Widget  # noqa: F401
from app.modules.rules.models.rule import Rule  # noqa: F401
from app.modules.alerts.models.alert import Alert  # noqa: F401
