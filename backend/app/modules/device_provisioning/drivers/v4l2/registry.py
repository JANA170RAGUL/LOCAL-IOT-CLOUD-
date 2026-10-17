from __future__ import annotations

import re
from typing import TYPE_CHECKING, Any
from app.modules.device_provisioning.drivers.base import HardwareDriver, IdentificationResult

if TYPE_CHECKING:
    from app.modules.device_provisioning.services.remote_executor import RemoteExecutor


class V4L2Driver(HardwareDriver):
    driver_id = "linux.v4l2"
    name = "Video4Linux2 Camera Driver"
    interface = "CAMERA"

    def identify(
        self,
        executor: RemoteExecutor,
        hardware: dict[str, Any],
    ) -> IdentificationResult:
        if hardware.get("component_type") not in ("CAMERA", "VIDEO"):
            return IdentificationResult(identified=False, status="UNKNOWN")

        node = hardware.get("address") or "/dev/video0"

        try:
            res = executor.execute(f"v4l2-ctl --device={node} --all 2>/dev/null")
            if res.stdout and res.return_code == 0:
                card = None
                driver = None
                bus_info = None

                for line in res.stdout.splitlines():
                    if "Card type" in line:
                        card = line.split(":", 1)[-1].strip()
                    elif "Driver name" in line:
                        driver = line.split(":", 1)[-1].strip()
                    elif "Bus info" in line:
                        bus_info = line.split(":", 1)[-1].strip()

                if card:
                    return IdentificationResult(
                        identified=True,
                        manufacturer="Video4Linux / " + (driver or "Linux"),
                        model=card,
                        driver_id=f"v4l2.{driver or 'generic'}",
                        confidence=0.95,
                        capabilities=["video_capture", "v4l2_device"],
                        metadata={
                            "device_node": node,
                            "card_type": card,
                            "v4l2_driver": driver,
                            "bus_info": bus_info,
                            "identification_method": "V4L2_CTL_QUERY",
                        },
                        status="IDENTIFIED",
                    )
        except Exception:
            pass

        return IdentificationResult(
            identified=True,
            manufacturer="Video4Linux",
            model=hardware.get("name") or "V4L2 Video Device",
            driver_id="linux.v4l2",
            confidence=0.6,
            capabilities=["video_capture"],
            metadata={"device_node": node, "identification_method": "V4L2_NODE"},
            status="DETECTED",
        )
