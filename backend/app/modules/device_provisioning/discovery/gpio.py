from __future__ import annotations

from typing import TYPE_CHECKING, Any
from app.modules.device_provisioning.discovery.base import HardwareDiscoveryProvider

if TYPE_CHECKING:
    from app.modules.device_provisioning.services.remote_executor import RemoteExecutor


class GPIOProvider(HardwareDiscoveryProvider):
    def discover(self, executor: RemoteExecutor) -> list[dict[str, Any]]:
        components = []
        try:
            res = executor.execute("ls /dev/gpiochip* 2>/dev/null")
            chips = res.stdout.split() if res.stdout else []
            for chip in chips:
                info_res = executor.execute(f"gpioinfo {chip} 2>/dev/null | head -n 5")
                line_count = len(info_res.stdout.splitlines()) if info_res.stdout else 32

                chip_name = chip.split("/")[-1]
                components.append({
                    "component_type": "GPIO",
                    "name": f"GPIO Controller ({chip_name})",
                    "interface": "GPIO",
                    "address": chip,
                    "manufacturer": "Broadcom",
                    "model": chip_name,
                    "metadata": {
                        "device_node": chip,
                        "estimated_lines": line_count,
                    },
                    "discovery_status": "DISCOVERED",
                })
        except Exception:
            pass
        return components
