"""
app/modules/device_provisioning/services/provisioning_service.py

Service layer for executing and tracking device provisioning workflows.
"""

from sqlalchemy.orm import Session

from app.modules.device_provisioning.models.device_agent import DeviceAgent
from app.modules.device_provisioning.models.hardware_component import HardwareComponent
from app.modules.device_provisioning.models.provisioning_job import ProvisioningJob
from app.modules.device_provisioning.repositories.connection_repository import ConnectionRepository
from app.modules.device_provisioning.services.connection_service import ConnectionService
from app.modules.device_provisioning.services.discovery_service import DiscoveryService
from app.shared.exceptions.provisioning import ProvisioningJobNotFound


class ProvisioningService:

    def __init__(self, db: Session):
        self.db = db
        self.repo = ConnectionRepository(db)
        self.conn_svc = ConnectionService(db)
        self.disc_svc = DiscoveryService(db)

    def start_provisioning(
        self,
        device_id: str,
        job_type: str = "FULL_PROVISION",
    ) -> ProvisioningJob:
        """
        Executes end-to-end provisioning pipeline:
        Connection Test -> Agent Detect & Install -> Hardware Discovery -> Completed
        """
        job = self.repo.create_job(
            device_id=device_id,
            job_type=job_type,
            status_str="RUNNING",
            current_step="CONNECTION_TEST",
            message="Initiating remote SSH connection test...",
        )

        try:
            # Step 1: CONNECTION_TEST
            test_res = self.conn_svc.test_connection(device_id)
            if not test_res.success:
                return self.repo.update_job_progress(
                    job=job,
                    status_str="FAILED",
                    current_step="CONNECTION_TEST",
                    message=f"Connection test failed: {test_res.message}",
                )

            # Step 2: AGENT_DETECT
            self.repo.update_job_progress(
                job=job,
                status_str="RUNNING",
                current_step="AGENT_DETECT",
                message="Detecting localiot-agent on edge device...",
            )
            self.disc_svc.detect_or_install_agent(device_id)

            # Step 3: HARDWARE_DISCOVERY
            self.repo.update_job_progress(
                job=job,
                status_str="RUNNING",
                current_step="HARDWARE_DISCOVERY",
                message="Scanning hardware buses (GPIO, I2C, SPI, UART, USB)...",
            )
            self.disc_svc.run_hardware_discovery(device_id)

            # Step 4: SUCCESS
            return self.repo.update_job_progress(
                job=job,
                status_str="SUCCESS",
                current_step="COMPLETED",
                message="Provisioning completed successfully. All hardware components & agent active.",
            )

        except Exception as exc:
            return self.repo.update_job_progress(
                job=job,
                status_str="FAILED",
                current_step=job.current_step,
                message=f"Provisioning error: {str(exc)}",
            )

    def get_job(self, job_id: str) -> ProvisioningJob:
        job = self.repo.get_job_by_id(job_id)
        if not job:
            raise ProvisioningJobNotFound()
        return job

    def get_hardware(self, device_id: str) -> list[HardwareComponent]:
        return self.disc_svc.list_hardware(device_id)

    def get_agent(self, device_id: str) -> DeviceAgent:
        return self.disc_svc.get_agent(device_id)
