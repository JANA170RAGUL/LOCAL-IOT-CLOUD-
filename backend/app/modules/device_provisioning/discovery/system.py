from __future__ import annotations

from typing import TYPE_CHECKING, Any
from app.modules.device_provisioning.discovery.base import HardwareDiscoveryProvider

if TYPE_CHECKING:
    from app.modules.device_provisioning.services.remote_executor import RemoteExecutor


class SystemProvider(HardwareDiscoveryProvider):
    def discover(self, executor: RemoteExecutor) -> list[dict[str, Any]]:
        components = []
        try:
            res = executor.execute("uname -m; uname -r; hostname; cat /etc/os-release 2>/dev/null | grep PRETTY_NAME")
            lines = res.stdout.splitlines() if res.stdout else []
            arch = lines[0] if len(lines) > 0 else "unknown"
            kernel = lines[1] if len(lines) > 1 else "unknown"
            host = lines[2] if len(lines) > 2 else "unknown"
            pretty_os = lines[3].split("=")[-1].strip('"') if len(lines) > 3 and "=" in lines[3] else "Linux"

            components.append({
                "component_type": "SYSTEM",
                "name": f"Linux Host ({host})",
                "interface": "SYSTEM",
                "address": host,
                "manufacturer": "Raspberry Pi Foundation / Linux",
                "model": f"{pretty_os} ({kernel})",
                "metadata": {
                    "architecture": arch,
                    "kernel": kernel,
                    "hostname": host,
                    "os": pretty_os,
                },
                "discovery_status": "DISCOVERED",
            })
        except Exception:
            pass
        return components
