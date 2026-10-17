from __future__ import annotations

import re
from typing import TYPE_CHECKING, Any
from app.modules.device_provisioning.drivers.base import HardwareDriver, IdentificationResult

if TYPE_CHECKING:
    from app.modules.device_provisioning.services.remote_executor import RemoteExecutor


class BME280Driver(HardwareDriver):
    driver_id = "bosch.bme280"
    name = "Bosch BME280 / BMP280 Sensor"
    interface = "I2C"

    def identify(
        self,
        executor: RemoteExecutor,
        hardware: dict[str, Any],
    ) -> IdentificationResult:
        if hardware.get("component_type") != "I2C":
            return IdentificationResult(identified=False, status="UNKNOWN")

        address = hardware.get("address", "").lower()
        if address not in ("0x76", "0x77"):
            return IdentificationResult(identified=False, status="UNKNOWN")

        bus = hardware.get("metadata", {}).get("bus", 1)

        try:
            # Query Chip ID Register 0xD0 via non-destructive i2cget
            res = executor.execute(f"i2cget -y {bus} {address} 0xd0 2>/dev/null")
            if res.stdout and res.return_code == 0:
                raw_hex = res.stdout.strip().lower()
                val = int(raw_hex, 16) if re.match(r"^0x[0-9a-fA-F]+$", raw_hex) else None

                if val == 0x60:
                    return IdentificationResult(
                        identified=True,
                        manufacturer="Bosch Sensortec",
                        model="BME280",
                        driver_id="bosch.bme280",
                        confidence=1.0,
                        capabilities=["temperature", "humidity", "pressure"],
                        metadata={
                            "chip_id_register": "0xD0",
                            "chip_id_hex": "0x60",
                            "identification_method": "I2C_CHIP_ID",
                        },
                        status="IDENTIFIED",
                    )
                elif val in (0x56, 0x57, 0x58):
                    return IdentificationResult(
                        identified=True,
                        manufacturer="Bosch Sensortec",
                        model="BMP280",
                        driver_id="bosch.bmp280",
                        confidence=1.0,
                        capabilities=["temperature", "pressure"],
                        metadata={
                            "chip_id_register": "0xD0",
                            "chip_id_hex": hex(val),
                            "identification_method": "I2C_CHIP_ID",
                        },
                        status="IDENTIFIED",
                    )
        except Exception:
            pass

        return IdentificationResult(
            identified=False,
            manufacturer=None,
            model="Unidentified I2C Device",
            confidence=0.1,
            status="UNKNOWN",
        )
