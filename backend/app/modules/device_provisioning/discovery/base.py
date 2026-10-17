from __future__ import annotations

from typing import TYPE_CHECKING, Any

if TYPE_CHECKING:
    from app.modules.device_provisioning.services.remote_executor import RemoteExecutor


class HardwareDiscoveryProvider:
    """
    Abstract base class for normalized hardware discovery providers.
    """

    def discover(self, executor: RemoteExecutor) -> list[dict[str, Any]]:
        raise NotImplementedError
