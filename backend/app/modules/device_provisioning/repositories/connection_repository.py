from datetime import datetime, timezone
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.modules.device_provisioning.models.device_agent import DeviceAgent
from app.modules.device_provisioning.models.device_connection import (
    DeviceConnection,
)
from app.modules.device_provisioning.models.hardware_component import HardwareComponent
from app.modules.device_provisioning.models.provisioning_job import ProvisioningJob
from app.shared.repositories.base_repository import BaseRepository


class ConnectionRepository(BaseRepository[DeviceConnection]):
    def __init__(self, db: Session):
        super().__init__(DeviceConnection)
        self.db = db

    def get_by_device_id(
        self,
        device_id: str,
    ) -> DeviceConnection | None:
        return (
            self.db.query(DeviceConnection)
            .filter(
                DeviceConnection.device_id == device_id,
                DeviceConnection.is_active.is_(True),
            )
            .first()
        )

    def exists_for_device(
        self,
        device_id: str,
    ) -> bool:
        return (
            self.db.query(DeviceConnection.id)
            .filter(
                DeviceConnection.device_id == device_id,
                DeviceConnection.is_active.is_(True),
            )
            .first()
            is not None
        )

    def deactivate(
        self,
        connection: DeviceConnection,
    ) -> DeviceConnection:
        connection.is_active = False
        self.db.add(connection)
        self.db.commit()
        self.db.refresh(connection)

        return connection

    # ── Job Operations ───────────────────────────────────────────────────────

    def create_job(
        self,
        device_id: str,
        job_type: str,
        status_str: str = "PENDING",
        current_step: str | None = None,
        message: str | None = None,
    ) -> ProvisioningJob:
        now = datetime.now(timezone.utc)
        job = ProvisioningJob(
            device_id=device_id,
            job_type=job_type,
            status=status_str,
            current_step=current_step,
            message=message,
            started_at=now if status_str == "RUNNING" else None,
        )
        self.db.add(job)
        self.db.commit()
        self.db.refresh(job)
        return job

    def update_job_progress(
        self,
        job: ProvisioningJob,
        status_str: str,
        current_step: str | None = None,
        message: str | None = None,
    ) -> ProvisioningJob:
        now = datetime.now(timezone.utc)
        job.status = status_str
        if current_step:
            job.current_step = current_step
        if message:
            job.message = message
        if status_str == "RUNNING" and not job.started_at:
            job.started_at = now
        elif status_str in ("SUCCESS", "FAILED", "CANCELLED"):
            job.completed_at = now

        self.db.commit()
        self.db.refresh(job)
        return job

    def get_job_by_id(self, job_id: str) -> ProvisioningJob | None:
        return self.db.get(ProvisioningJob, job_id)

    # ── Hardware Component Operations ────────────────────────────────────────

    def add_hardware_component(
        self,
        device_id: str,
        component_type: str,
        name: str,
        interface: str | None = None,
        address: str | None = None,
        manufacturer: str | None = None,
        model: str | None = None,
        metadata_json: dict | None = None,
        discovery_status: str = "DISCOVERED",
    ) -> HardwareComponent:
        comp = HardwareComponent(
            device_id=device_id,
            component_type=component_type,
            name=name,
            interface=interface,
            address=address,
            manufacturer=manufacturer,
            model=model,
            metadata_json=metadata_json,
            discovery_status=discovery_status,
        )
        self.db.add(comp)
        self.db.commit()
        self.db.refresh(comp)
        return comp

    def add_hardware(
        self,
        device_id: str,
        component_type: str,
        name: str,
        interface: str | None = None,
        address: str | None = None,
        manufacturer: str | None = None,
        model: str | None = None,
        metadata_json: dict | None = None,
        discovery_status: str = "DISCOVERED",
    ) -> HardwareComponent:
        return self.add_hardware_component(
            device_id=device_id,
            component_type=component_type,
            name=name,
            interface=interface,
            address=address,
            manufacturer=manufacturer,
            model=model,
            metadata_json=metadata_json,
            discovery_status=discovery_status,
        )

    def list_components_by_device(self, device_id: str) -> list[HardwareComponent]:
        stmt = select(HardwareComponent).where(HardwareComponent.device_id == device_id).order_by(HardwareComponent.name)
        return list(self.db.scalars(stmt).all())

    def list_hardware(self, device_id: str) -> list[HardwareComponent]:
        return self.list_components_by_device(device_id)

    def clear_hardware_components(self, device_id: str) -> int:
        stmt = select(HardwareComponent).where(HardwareComponent.device_id == device_id)
        comps = list(self.db.scalars(stmt).all())
        count = len(comps)
        for comp in comps:
            self.db.delete(comp)
        self.db.commit()
        return count

    # ── Device Agent Operations ──────────────────────────────────────────────

    def get_agent_by_device_id(self, device_id: str) -> DeviceAgent | None:
        stmt = select(DeviceAgent).where(DeviceAgent.device_id == device_id)
        return self.db.scalar(stmt)

    def upsert_agent(
        self,
        device_id: str,
        installed: bool = True,
        agent_name: str = "localiot-agent",
        agent_version: str | None = "1.0.0-edge",
        platform: str | None = "Linux/Raspbian",
        architecture: str | None = "arm64",
        service_status: str | None = "RUNNING",
    ) -> DeviceAgent:
        now = datetime.now(timezone.utc)
        agent = self.get_agent_by_device_id(device_id)
        if not agent:
            agent = DeviceAgent(
                device_id=device_id,
                installed=installed,
                agent_name=agent_name,
                agent_version=agent_version,
                platform=platform,
                architecture=architecture,
                service_status=service_status,
                last_seen_at=now,
            )
            self.db.add(agent)
        else:
            agent.installed = installed
            agent.agent_name = agent_name
            agent.agent_version = agent_version
            agent.platform = platform
            agent.architecture = architecture
            agent.service_status = service_status
            agent.last_seen_at = now

        self.db.commit()
        self.db.refresh(agent)
        return agent