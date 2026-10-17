from __future__ import annotations

from dataclasses import dataclass
from typing import TYPE_CHECKING, Any

if TYPE_CHECKING:
    from app.modules.device_provisioning.services.remote_executor import RemoteExecutor


@dataclass
class IdentificationResult:
    identified: bool
    manufacturer: str | None = None
    model: str | None = None
    driver_id: str | None = None
    confidence: float = 0.0
    capabilities: list[str] | None = None
    metadata: dict[str, Any] | None = None
    status: str = "UNKNOWN"


class HardwareDriver:
    driver_id: str = ""
    name: str = ""
    interface: str = ""

    def identify(
        self,
        executor: RemoteExecutor,
        hardware: dict[str, Any],
    ) -> IdentificationResult:
        raise NotImplementedError
