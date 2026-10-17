from __future__ import annotations

from app.modules.device_provisioning.services.remote_executor import (
    RemoteExecutor,
    RemoteExecutionError,
)


class DeviceIdentityService:
    """
    Reads basic operating-system information from a remote Linux device.
    """

    def __init__(self, executor: RemoteExecutor) -> None:
        self.executor = executor

    def get_identity(self) -> dict:
        """
        Read remote Raspberry Pi / Linux identity information.
        """

        os_release = self._get_os_release()
        architecture = self._get_architecture()
        kernel = self._get_kernel()
        hostname = self._get_hostname()

        return {
            "hostname": hostname,
            "architecture": architecture,
            "kernel": kernel,
            "os_release": os_release,
        }

    def _get_os_release(self) -> str:
        result = self.executor.execute(
            "cat /etc/os-release",
        )

        if not result.stdout:
            raise RemoteExecutionError(
                "Remote device returned an empty /etc/os-release."
            )

        return result.stdout

    def _get_architecture(self) -> str:
        result = self.executor.execute(
            "uname -m",
        )

        if not result.stdout:
            raise RemoteExecutionError(
                "Unable to determine remote architecture."
            )

        return result.stdout.strip()

    def _get_kernel(self) -> str:
        result = self.executor.execute(
            "uname -r",
        )

        if not result.stdout:
            raise RemoteExecutionError(
                "Unable to determine remote kernel version."
            )

        return result.stdout.strip()

    def _get_hostname(self) -> str:
        result = self.executor.execute(
            "hostname",
        )

        if not result.stdout:
            raise RemoteExecutionError(
                "Unable to determine remote hostname."
            )

        return result.stdout.strip()