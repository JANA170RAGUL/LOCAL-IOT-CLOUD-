from __future__ import annotations

from typing import TYPE_CHECKING, Any
from app.modules.device_provisioning.drivers.base import HardwareDriver, IdentificationResult

if TYPE_CHECKING:
    from app.modules.device_provisioning.services.remote_executor import RemoteExecutor


class ADS1x15Driver(HardwareDriver):
    driver_id = "ti.ads1x15"
    name = "Texas Instruments ADS1015 / ADS1115 ADC"
    interface = "I2C"

    def identify(
        self,
        executor: RemoteExecutor,
        hardware: dict[str, Any],
    ) -> IdentificationResult:
        if hardware.get("component_type") != "I2C":
            return IdentificationResult(identified=False, status="UNKNOWN")

        address = hardware.get("address", "").lower()
        if address not in ("0x48", "0x49", "0x4a", "0x4b"):
            return IdentificationResult(identified=False, status="UNKNOWN")

        bus = hardware.get("metadata", {}).get("bus", 1)

        try:
            # Query pointer register 0x00 (conversion register)
            res = executor.execute(f"i2cget -y {bus} {address} 0x00 w 2>/dev/null")
            if res.stdout and res.return_code == 0:
                return IdentificationResult(
                    identified=True,
                    manufacturer="Texas Instruments",
                    model="ADS1x15-compatible ADC",
                    driver_id="ti.ads1x15",
                    confidence=0.75,
                    capabilities=["analog_input", "adc", "4_channels"],
                    metadata={
                        "bus": bus,
                        "address": address,
                        "identification_method": "I2C_REGISTER_PROBE",
                    },
                    status="DETECTED",
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
