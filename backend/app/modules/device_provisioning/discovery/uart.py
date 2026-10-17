from __future__ import annotations

from typing import TYPE_CHECKING, Any
from app.modules.device_provisioning.discovery.base import HardwareDiscoveryProvider

if TYPE_CHECKING:
    from app.modules.device_provisioning.services.remote_executor import RemoteExecutor


class UARTProvider(HardwareDiscoveryProvider):
    def discover(self, executor: RemoteExecutor) -> list[dict[str, Any]]:
        components = []
        try:
            res = executor.execute("ls /dev/ttyAMA* /dev/ttyS* /dev/ttyUSB* /dev/ttyACM* 2>/dev/null")
            nodes = res.stdout.split() if res.stdout else []

            for node in nodes:
                name = node.split("/")[-1]
                interface_type = "USB-Serial" if "USB" in name or "ACM" in name else "Hardware UART"

                components.append({
                    "component_type": "UART",
                    "name": f"Serial Port ({name})",
                    "interface": "UART",
                    "address": node,
                    "manufacturer": interface_type,
                    "model": name,
                    "metadata": {
                        "device_node": node,
                        "port_type": interface_type,
                    },
                    "discovery_status": "DISCOVERED",
                })
        except Exception:
            pass
        return components
