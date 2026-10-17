from __future__ import annotations

from typing import TYPE_CHECKING, Any
from app.modules.device_provisioning.drivers.base import HardwareDriver, IdentificationResult

if TYPE_CHECKING:
    from app.modules.device_provisioning.services.remote_executor import RemoteExecutor


USB_KNOWN_DEVICES: dict[tuple[str, str], dict[str, Any]] = {
    ("046d", "082d"): {
        "manufacturer": "Logitech",
        "model": "HD Pro Webcam C920",
        "driver_id": "logitech.c920",
        "capabilities": ["video_capture", "h264", "v4l2"],
    },
    ("046d", "0825"): {
        "manufacturer": "Logitech",
        "model": "HD Webcam C270",
        "driver_id": "logitech.c270",
        "capabilities": ["video_capture", "v4l2"],
    },
    ("0424", "9514"): {
        "manufacturer": "Microchip / SMSC",
        "model": "SMC9514 Ethernet & USB Hub Controller",
        "driver_id": "smsc.smc9514",
        "capabilities": ["usb_hub", "ethernet"],
    },
    ("0424", "ec00"): {
        "manufacturer": "Microchip / SMSC",
        "model": "SMSC9512/9514 Fast Ethernet Adapter",
        "driver_id": "smsc.smc9512",
        "capabilities": ["ethernet"],
    },
    ("1a86", "7523"): {
        "manufacturer": "QinHeng Electronics",
        "model": "CH340 USB-Serial Converter",
        "driver_id": "wch.ch340",
        "capabilities": ["serial", "uart_bridge"],
    },
    ("0403", "6001"): {
        "manufacturer": "FTDI",
        "model": "FT232R USB UART IC",
        "driver_id": "ftdi.ft232r",
        "capabilities": ["serial", "uart_bridge"],
    },
    ("10c4", "ea60"): {
        "manufacturer": "Silicon Labs",
        "model": "CP2102/CP2109 UART Bridge",
        "driver_id": "silabs.cp210x",
        "capabilities": ["serial", "uart_bridge"],
    },
    ("0b00", "0421"): {
        "manufacturer": "Realtek",
        "model": "802.11n WLAN Adapter",
        "driver_id": "realtek.rtl8192",
        "capabilities": ["wifi", "network"],
    },
}


class USBDriver(HardwareDriver):
    driver_id = "generic.usb"
    name = "USB Device Registry Driver"
    interface = "USB"

    def identify(
        self,
        executor: RemoteExecutor,
        hardware: dict[str, Any],
    ) -> IdentificationResult:
        if hardware.get("component_type") != "USB":
            return IdentificationResult(identified=False, status="UNKNOWN")

        metadata = hardware.get("metadata") or {}
        vid = (metadata.get("vendor_id") or "").lower()
        pid = (metadata.get("product_id") or "").lower()

        if (vid, pid) in USB_KNOWN_DEVICES:
            info = USB_KNOWN_DEVICES[(vid, pid)]
            return IdentificationResult(
                identified=True,
                manufacturer=info["manufacturer"],
                model=info["model"],
                driver_id=info["driver_id"],
                confidence=1.0,
                capabilities=info.get("capabilities", []),
                metadata={
                    "vendor_id": vid,
                    "product_id": pid,
                    "bus": metadata.get("bus"),
                    "device": metadata.get("device"),
                    "identification_method": "USB_VID_PID_MATCH",
                },
                status="IDENTIFIED",
            )

        # Generic USB match with default information from lsusb parsing
        return IdentificationResult(
            identified=True,
            manufacturer=hardware.get("manufacturer") or f"VID:{vid}",
            model=hardware.get("name") or f"USB Device {vid}:{pid}",
            driver_id="generic.usb",
            confidence=0.6,
            capabilities=["usb_peripheral"],
            metadata={
                "vendor_id": vid,
                "product_id": pid,
                "identification_method": "GENERIC_USB_DESCR",
            },
            status="DETECTED",
        )
