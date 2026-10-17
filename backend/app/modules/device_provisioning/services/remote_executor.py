from __future__ import annotations

import subprocess
from dataclasses import dataclass


class RemoteExecutionError(Exception):
    """Raised when a remote SSH command cannot be executed."""


@dataclass
class RemoteCommandResult:
    stdout: str
    stderr: str
    return_code: int


class RemoteExecutor:
    """
    Executes commands on a remote Linux device using SSH.

    Supports:
    - SSH_KEY authentication (preferred)
    - PASSWORD authentication (via sshpass)
    """

    def __init__(
        self,
        host: str,
        port: int,
        username: str,
        credential_ref: str,
        authentication_type: str = "SSH_KEY",
        connect_timeout: int = 10,
    ) -> None:
        if not host:
            raise ValueError("SSH host is required.")

        if not username:
            raise ValueError("SSH username is required.")

        if not credential_ref:
            raise ValueError("SSH credential_ref (key path or password) is required.")

        self.host = host
        self.port = port
        self.username = username
        self.credential_ref = credential_ref
        self.authentication_type = authentication_type.upper() if authentication_type else "SSH_KEY"
        self.connect_timeout = connect_timeout

    def _base_command(self) -> list[str]:
        common_opts = [
            "-p",
            str(self.port),
            "-o",
            f"ConnectTimeout={self.connect_timeout}",
            "-o",
            "StrictHostKeyChecking=no",
            "-o",
            "UserKnownHostsFile=/dev/null",
        ]

        if self.authentication_type == "PASSWORD":
            return [
                "sshpass",
                "-p",
                self.credential_ref,
                "ssh",
                *common_opts,
                f"{self.username}@{self.host}",
            ]

        return [
            "ssh",
            "-i",
            self.credential_ref,
            "-o",
            "BatchMode=yes",
            *common_opts,
            f"{self.username}@{self.host}",
        ]

    def execute(
        self,
        command: str,
        timeout: int = 30,
    ) -> RemoteCommandResult:
        """
        Execute one command on the remote Linux device.
        """

        if not command or not command.strip():
            raise ValueError("Remote command cannot be empty.")

        ssh_command = self._base_command()
        ssh_command.append(command)

        try:
            result = subprocess.run(
                ssh_command,
                capture_output=True,
                text=True,
                timeout=timeout,
                check=False,
            )

        except subprocess.TimeoutExpired as exc:
            raise RemoteExecutionError(
                f"SSH command timed out after {timeout} seconds."
            ) from exc

        except FileNotFoundError as exc:
            raise RemoteExecutionError(
                "SSH client was not found inside the backend container."
            ) from exc

        except OSError as exc:
            raise RemoteExecutionError(
                f"Unable to execute SSH client: {exc}"
            ) from exc

        stdout = (result.stdout or "").strip()
        stderr = (result.stderr or "").strip()

        if result.returncode != 0:
            message = stderr or stdout or "Unknown SSH error."

            raise RemoteExecutionError(
                f"SSH command failed with exit code "
                f"{result.returncode}: {message}"
            )

        return RemoteCommandResult(
            stdout=stdout,
            stderr=stderr,
            return_code=result.returncode,
        )

    def test_connection(self) -> RemoteCommandResult:
        """
        Verify that SSH connectivity and authentication work.
        """

        return self.execute(
            "echo LOCAL_IOT_SSH_OK",
            timeout=self.connect_timeout + 5,
        )