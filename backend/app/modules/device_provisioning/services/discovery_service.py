from __future__ import annotations

from app.modules.device_provisioning.discovery.system import SystemProvider
from app.modules.device_provisioning.discovery.gpio import GPIOProvider
from app.modules.device_provisioning.discovery.i2c import I2CProvider
from app.modules.device_provisioning.discovery.spi import SPIProvider
from app.modules.device_provisioning.discovery.uart import UARTProvider
from app.modules.device_provisioning.discovery.usb import USBProvider
from app.modules.device_provisioning.discovery.camera import CameraProvider
from app.modules.device_provisioning.models.hardware_component import HardwareComponent
from app.modules.device_provisioning.repositories.connection_repository import (
    ConnectionRepository,
)
from app.modules.device_provisioning.services.device_identity_service import (
    DeviceIdentityService,
)
from app.modules.device_provisioning.services.remote_executor import (
    RemoteExecutionError,
    RemoteExecutor,
)


class DiscoveryService:
    """
    Handles remote device discovery.

    Phase 1 (Level 1 Interface Discovery):
        - Connect to Raspberry Pi using SSH (SSH_KEY or PASSWORD).
        - Verify SSH connectivity.
        - Read Linux identity & OS metadata.
        - Discover real physical & virtual Linux interfaces (System, GPIO, I2C, SPI, UART, USB, Camera).
    """

    def __init__(self, db):
        self.db = db
        self.repo = ConnectionRepository(db)

    def _create_executor(self, connection) -> RemoteExecutor:
        if not connection:
            raise RemoteExecutionError(
                "Device SSH connection is not configured."
            )

        if connection.connection_type != "SSH":
            raise RemoteExecutionError(
                f"Unsupported connection type: {connection.connection_type}"
            )

        if connection.authentication_type not in ("SSH_KEY", "PASSWORD"):
            raise RemoteExecutionError(
                f"Unsupported authentication type: {connection.authentication_type}"
            )

        if not connection.credential_ref:
            raise RemoteExecutionError(
                "SSH credential reference is not configured."
            )

        return RemoteExecutor(
            host=connection.host,
            port=connection.port,
            username=connection.username,
            credential_ref=connection.credential_ref,
            authentication_type=connection.authentication_type,
        )

    # ============================================================
    # AGENT / SYSTEM DETECTION
    # ============================================================

    def detect_or_install_agent(self, device_id: str):
        """
        Detect the LocalIoT agent / remote Linux device.

        1. Loads saved SSH configuration (SSH_KEY or PASSWORD).
        2. Opens real SSH connection.
        3. Reads remote Linux OS release, architecture, and hostname.
        4. Stores updated device agent state in DB.
        """

        connection = self.repo.get_by_device_id(device_id)
        executor = self._create_executor(connection)

        # 1. Test SSH Connection
        executor.test_connection()

        # 2. Read remote system identity
        identity_service = DeviceIdentityService(executor)
        identity = identity_service.get_identity()

        # 3. Store agent/device state
        os_release = identity["os_release"]
        platform = os_release[:100]

        agent = self.repo.upsert_agent(
            device_id=device_id,
            installed=True,
            agent_name="localiot-agent",
            agent_version="1.0.0-edge",
            platform=platform,
            architecture=identity["architecture"],
            service_status="SSH_CONNECTED",
        )

        return agent

    # ============================================================
    # REAL HARDWARE DISCOVERY (LEVEL 1 INTERFACE DISCOVERY)
    # ============================================================

    def run_hardware_discovery(self, device_id: str) -> list[HardwareComponent]:
        """
        Scans remote Raspberry Pi hardware interfaces via RemoteExecutor:
        - System Host
        - GPIO Controllers (/dev/gpiochip*)
        - I2C Buses & Active Hex Addresses (/dev/i2c-*)
        - SPI Channels (/dev/spidev*)
        - Serial / UART Ports (/dev/ttyAMA*, /dev/ttyS*, /dev/ttyUSB*)
        - USB Peripheral Nodes (lsusb)
        - Video / Camera Interfaces (/dev/video*)
        """

        connection = self.repo.get_by_device_id(device_id)
        executor = self._create_executor(connection)

        providers = [
            SystemProvider(),
            GPIOProvider(),
            I2CProvider(),
            SPIProvider(),
            UARTProvider(),
            USBProvider(),
            CameraProvider(),
        ]

        discovered_items = []
        for provider in providers:
            try:
                items = provider.discover(executor)
                discovered_items.extend(items)
            except Exception:
                pass

        # Clear existing components before storing fresh scan results
        self.repo.clear_hardware_components(device_id)

        # Driver Registry for Level 2 Hardware Identification
        from app.modules.device_provisioning.drivers.registry import DriverRegistry
        driver_registry = DriverRegistry()

        saved_components = []
        for item in discovered_items:
            # Perform Level 2 Hardware Identification
            ident = driver_registry.identify_hardware(executor, item)

            merged_meta = dict(item.get("metadata") or {})
            if ident.metadata:
                merged_meta.update(ident.metadata)

            merged_meta["driver_id"] = ident.driver_id
            merged_meta["confidence"] = ident.confidence
            merged_meta["capabilities"] = ident.capabilities or []

            comp = self.repo.add_hardware_component(
                device_id=device_id,
                component_type=item["component_type"],
                name=ident.model or item["name"],
                interface=item.get("interface"),
                address=item.get("address"),
                manufacturer=ident.manufacturer or item.get("manufacturer"),
                model=ident.model or item.get("model"),
                metadata_json=merged_meta,
                discovery_status=ident.status if ident.identified else item.get("discovery_status", "UNKNOWN"),
            )
            saved_components.append(comp)

        return saved_components if saved_components else self.repo.list_components_by_device(device_id)

    def identify_hardware(self, device_id: str) -> list[HardwareComponent]:
        """
        Re-runs Level 2 Hardware Identification over all stored components for a device.
        """
        connection = self.repo.get_by_device_id(device_id)
        executor = self._create_executor(connection)

        from app.modules.device_provisioning.drivers.registry import DriverRegistry
        driver_registry = DriverRegistry()

        components = self.repo.list_components_by_device(device_id)
        updated_components = []

        for comp in components:
            raw_item = {
                "component_type": comp.component_type,
                "interface_type": comp.interface,
                "name": comp.name,
                "address": comp.address,
                "manufacturer": comp.manufacturer,
                "model": comp.model,
                "metadata": comp.metadata_json or {},
            }

            ident = driver_registry.identify_hardware(executor, raw_item)

            if ident.identified:
                merged_meta = dict(comp.metadata_json or {})
                if ident.metadata:
                    merged_meta.update(ident.metadata)
                merged_meta["driver_id"] = ident.driver_id
                merged_meta["confidence"] = ident.confidence
                merged_meta["capabilities"] = ident.capabilities or []

                comp.manufacturer = ident.manufacturer or comp.manufacturer
                comp.model = ident.model or comp.model
                comp.discovery_status = ident.status
                comp.metadata_json = merged_meta
                self.db.add(comp)
                updated_components.append(comp)

        self.db.commit()
        return self.repo.list_components_by_device(device_id)

    # ============================================================
    # AGENT & HARDWARE GETTERS
    # ============================================================

    def get_agent(self, device_id: str):
        agent = self.repo.get_agent_by_device_id(device_id)
        return agent

    def list_hardware(self, device_id: str) -> list[HardwareComponent]:
        return self.repo.list_components_by_device(device_id)