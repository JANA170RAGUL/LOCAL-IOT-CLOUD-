from __future__ import annotations

from typing import TYPE_CHECKING, Any
from app.modules.device_provisioning.drivers.base import HardwareDriver, IdentificationResult
from app.modules.device_provisioning.drivers.i2c import BME280Driver, ADS1x15Driver
from app.modules.device_provisioning.drivers.usb import USBDriver
from app.modules.device_provisioning.drivers.v4l2 import V4L2Driver

if TYPE_CHECKING:
    from app.modules.device_provisioning.services.remote_executor import RemoteExecutor


class DriverRegistry:
    """
    Central Level 2 Hardware Identification & Driver Registry.
    Runs interface-specific driver identification without guessing unverified hardware names.
    """

    def __init__(self) -> None:
        self.i2c_drivers: list[HardwareDriver] = [
            BME280Driver(),
            ADS1x15Driver(),
        ]
        self.usb_driver = USBDriver()
        self.v4l2_driver = V4L2Driver()

    def identify_hardware(
        self,
        executor: RemoteExecutor,
        hardware: dict[str, Any],
    ) -> IdentificationResult:
        comp_type = (hardware.get("component_type") or hardware.get("interface_type") or "").upper()

        # 1. I2C Probing
        if comp_type == "I2C":
            for driver in self.i2c_drivers:
                result = driver.identify(executor, hardware)
                if result.identified:
                    return result
            
            # Default I2C bus vs slave status
            address = hardware.get("address", "")
            if "i2c-" in address.lower() or "bus" in hardware.get("name", "").lower():
                return IdentificationResult(
                    identified=True,
                    manufacturer="Broadcom / SoC",
                    model=hardware.get("name") or "I2C Controller Bus",
                    driver_id="linux.i2c_bus",
                    confidence=1.0,
                    capabilities=["i2c_bus"],
                    status="AVAILABLE",
                )
            return IdentificationResult(
                identified=False,
                manufacturer="Unidentified Hardware",
                model=f"I2C Device ({address})",
                driver_id="generic.i2c_slave",
                confidence=0.3,
                capabilities=["i2c_slave"],
                status="UNKNOWN",
            )

        # 2. USB Probing
        elif comp_type == "USB":
            return self.usb_driver.identify(executor, hardware)

        # 3. Camera / V4L2 Probing
        elif comp_type in ("CAMERA", "VIDEO"):
            return self.v4l2_driver.identify(executor, hardware)

        # 4. GPIO Controllers
        elif comp_type == "GPIO":
            node = hardware.get("address") or "/dev/gpiochip"
            return IdentificationResult(
                identified=True,
                manufacturer="Broadcom",
                model=hardware.get("name") or "GPIO Controller",
                driver_id="linux.gpiochip",
                confidence=0.9,
                capabilities=["gpio_input", "gpio_output", "gpio_irq"],
                metadata={"device_node": node},
                status="AVAILABLE",
            )

        # 5. SPI Channels
        elif comp_type == "SPI":
            return IdentificationResult(
                identified=True,
                manufacturer="Broadcom",
                model=hardware.get("name") or "SPI Master Controller",
                driver_id="linux.spidev",
                confidence=0.85,
                capabilities=["spi_master", "spi_transfer"],
                metadata={"address": hardware.get("address")},
                status="AVAILABLE",
            )

        # 6. Serial / UART Ports
        elif comp_type == "UART":
            return IdentificationResult(
                identified=True,
                manufacturer=hardware.get("manufacturer") or "Hardware UART",
                model=hardware.get("name") or "Serial Port",
                driver_id="linux.tty",
                confidence=0.85,
                capabilities=["serial_comm", "tty_device"],
                metadata={"device_node": hardware.get("address")},
                status="AVAILABLE",
            )

        # 7. System Host
        elif comp_type == "SYSTEM":
            return IdentificationResult(
                identified=True,
                manufacturer="Raspberry Pi Foundation / Linux",
                model=hardware.get("model") or "Linux Edge Node",
                driver_id="linux.system",
                confidence=1.0,
                capabilities=["host_os", "system_telemetry"],
                status="IDENTIFIED",
            )

        return IdentificationResult(
            identified=False,
            manufacturer=None,
            model=hardware.get("name") or "Unknown Device",
            confidence=0.0,
            status="UNKNOWN",
        )
