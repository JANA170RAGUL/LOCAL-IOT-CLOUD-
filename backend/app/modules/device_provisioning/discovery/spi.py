from __future__ import annotations

import re
from typing import TYPE_CHECKING, Any
from app.modules.device_provisioning.discovery.base import HardwareDiscoveryProvider

if TYPE_CHECKING:
    from app.modules.device_provisioning.services.remote_executor import RemoteExecutor


class SPIProvider(HardwareDiscoveryProvider):
    def discover(self, executor: RemoteExecutor) -> list[dict[str, Any]]:
        components = []
        try:
            res = executor.execute("ls /dev/spidev* 2>/dev/null")
            nodes = res.stdout.split() if res.stdout else []

            for node in nodes:
                match = re.search(r"spidev(\d+)\.(\d+)", node)
                bus = int(match.group(1)) if match else 0
                chip_select = int(match.group(2)) if match else 0

                components.append({
                    "component_type": "SPI",
                    "name": f"SPI Bus {bus} (CE{chip_select})",
                    "interface": "SPI",
                    "address": f"CE{chip_select}",
                    "manufacturer": "Broadcom",
                    "model": f"spidev{bus}.{chip_select}",
                    "metadata": {
                        "bus": bus,
                        "chip_select": chip_select,
                        "device_node": node,
                    },
                    "discovery_status": "DISCOVERED",
                })
        except Exception:
            pass
        return components
