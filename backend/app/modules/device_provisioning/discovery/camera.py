from __future__ import annotations

from typing import TYPE_CHECKING, Any
from app.modules.device_provisioning.discovery.base import HardwareDiscoveryProvider

if TYPE_CHECKING:
    from app.modules.device_provisioning.services.remote_executor import RemoteExecutor


class CameraProvider(HardwareDiscoveryProvider):
    def discover(self, executor: RemoteExecutor) -> list[dict[str, Any]]:
        components = []
        try:
            res = executor.execute("ls /dev/video* 2>/dev/null")
            nodes = res.stdout.split() if res.stdout else []

            for node in nodes:
                node_name = node.split("/")[-1]

                v4l2_res = executor.execute(f"v4l2-ctl --device={node} --info 2>/dev/null | grep 'Card type'")
                card_name = v4l2_res.stdout.split(":")[-1].strip() if v4l2_res.stdout and ":" in v4l2_res.stdout else f"Video Device ({node_name})"

                components.append({
                    "component_type": "CAMERA",
                    "name": card_name,
                    "interface": "V4L2 / Video",
                    "address": node,
                    "manufacturer": "Video4Linux",
                    "model": node_name,
                    "metadata": {
                        "device_node": node,
                        "v4l2_card": card_name,
                    },
                    "discovery_status": "DISCOVERED",
                })
        except Exception:
            pass
        return components
