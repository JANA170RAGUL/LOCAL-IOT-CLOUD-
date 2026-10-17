from __future__ import annotations

import re
from typing import TYPE_CHECKING, Any
from app.modules.device_provisioning.discovery.base import HardwareDiscoveryProvider

if TYPE_CHECKING:
    from app.modules.device_provisioning.services.remote_executor import RemoteExecutor


class USBProvider(HardwareDiscoveryProvider):
    def discover(self, executor: RemoteExecutor) -> list[dict[str, Any]]:
        components = []
        try:
            res = executor.execute("lsusb 2>/dev/null")
            if res.stdout and res.return_code == 0:
                for line in res.stdout.splitlines():
                    match = re.search(r"Bus (\d+) Device (\d+): ID ([0-9a-fA-F]{4}):([0-9a-fA-F]{4})\s+(.*)", line)
                    if match:
                        bus = match.group(1)
                        device = match.group(2)
                        vid = match.group(3)
                        pid = match.group(4)
                        description = match.group(5).strip()

                        components.append({
                            "component_type": "USB",
                            "name": description or f"USB Device {vid}:{pid}",
                            "interface": "USB",
                            "address": f"Bus {bus} Dev {device}",
                            "manufacturer": f"VID:{vid}",
                            "model": f"PID:{pid}",
                            "metadata": {
                                "vendor_id": vid,
                                "product_id": pid,
                                "bus": bus,
                                "device": device,
                                "raw_lsusb": line,
                            },
                            "discovery_status": "DISCOVERED",
                        })
        except Exception:
            pass
        return components
