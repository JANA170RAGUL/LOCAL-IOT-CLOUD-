from __future__ import annotations

import re
from typing import TYPE_CHECKING, Any
from app.modules.device_provisioning.discovery.base import HardwareDiscoveryProvider

if TYPE_CHECKING:
    from app.modules.device_provisioning.services.remote_executor import RemoteExecutor


class I2CProvider(HardwareDiscoveryProvider):
    def discover(self, executor: RemoteExecutor) -> list[dict[str, Any]]:
        components = []
        try:
            res = executor.execute("ls /dev/i2c-* 2>/dev/null")
            bus_nodes = res.stdout.split() if res.stdout else []

            for node in bus_nodes:
                match = re.search(r"i2c-(\d+)", node)
                if not match:
                    continue
                bus_num = int(match.group(1))

                components.append({
                    "component_type": "I2C",
                    "name": f"I2C Bus {bus_num}",
                    "interface": "I2C",
                    "address": node,
                    "manufacturer": "Broadcom / SoC",
                    "model": f"i2c-{bus_num}",
                    "metadata": {
                        "bus": bus_num,
                        "node": node,
                    },
                    "discovery_status": "DISCOVERED",
                })

                # Check active addresses with i2cdetect if tool is installed
                detect_res = executor.execute(f"i2cdetect -y {bus_num} 2>/dev/null")
                if detect_res.stdout and detect_res.return_code == 0:
                    found_addresses = []
                    for line in detect_res.stdout.splitlines()[1:]:
                        parts = line.split(":")
                        if len(parts) == 2:
                            for addr in parts[1].split():
                                if addr not in ("--", "UU") and re.match(r"^[0-9a-fA-F]{2}$", addr):
                                    found_addresses.append(f"0x{addr}")

                    for hex_addr in found_addresses:
                        components.append({
                            "component_type": "I2C",
                            "name": f"I2C Device ({hex_addr})",
                            "interface": "I2C",
                            "address": hex_addr,
                            "manufacturer": "Unidentified Hardware",
                            "model": f"I2C Slave {hex_addr}",
                            "metadata": {
                                "bus": bus_num,
                                "address_hex": hex_addr,
                            },
                            "discovery_status": "DISCOVERED",
                        })
        except Exception:
            pass
        return components
