from datetime import datetime, timezone

from sqlalchemy.orm import Session

from app.modules.device_provisioning.models.device_connection import (
    DeviceConnection,
)
from app.modules.device_provisioning.repositories.connection_repository import (
    ConnectionRepository,
)
from app.modules.device_provisioning.schemas.provisioning import (
    ConnectionTestResponse,
    DeviceConnectionCreate,
    DeviceConnectionUpdate,
)


from app.modules.device_provisioning.services.remote_executor import (
    RemoteExecutor,
    RemoteExecutionError,
)


class ConnectionService:
    def __init__(self, db: Session):
        self.db = db
        self.repository = ConnectionRepository(db)

    def get_connection(
        self,
        device_id: str,
    ) -> DeviceConnection | None:
        return self.repository.get_by_device_id(device_id)

    def create_connection(
        self,
        device_id: str,
        data: DeviceConnectionCreate,
    ) -> DeviceConnection:

        existing = self.repository.get_by_device_id(device_id)

        if existing:
            raise ValueError(
                "Connection configuration already exists for this device"
            )

        connection = DeviceConnection(
            device_id=device_id,
            connection_type=data.connection_type,
            host=data.host,
            port=data.port,
            username=data.username,
            authentication_type=data.authentication_type,
            credential_ref=data.credential_ref,
            host_key_verified=data.host_key_verified,
        )

        self.db.add(connection)
        self.db.commit()
        self.db.refresh(connection)

        return connection

    def update_connection(
        self,
        device_id: str,
        data: DeviceConnectionUpdate,
    ) -> DeviceConnection:

        connection = self.repository.get_by_device_id(device_id)

        if not connection:
            raise ValueError(
                "Connection configuration not found"
            )

        update_data = data.model_dump(
            exclude_unset=True
        )

        for field, value in update_data.items():
            setattr(connection, field, value)

        self.db.add(connection)
        self.db.commit()
        self.db.refresh(connection)

        return connection

    def delete_connection(
        self,
        device_id: str,
    ) -> DeviceConnection:

        connection = self.repository.get_by_device_id(device_id)

        if not connection:
            raise ValueError(
                "Connection configuration not found"
            )

        return self.repository.deactivate(connection)

    def test_connection(
        self,
        device_id: str,
    ) -> ConnectionTestResponse:

        connection = self.repository.get_by_device_id(device_id)

        if not connection:
            raise ValueError(
                "Device connection is not configured."
            )

        if connection.connection_type != "SSH":
            raise ValueError(
                f"Unsupported connection type: {connection.connection_type}"
            )

        if connection.authentication_type not in ("SSH_KEY", "PASSWORD"):
            raise ValueError(
                f"Unsupported authentication type: {connection.authentication_type}"
            )

        if not connection.credential_ref:
            raise ValueError(
                "SSH credential_ref (private key path or password) is not configured."
            )

        tested_at = datetime.now(timezone.utc)

        try:
            executor = RemoteExecutor(
                host=connection.host,
                port=connection.port,
                username=connection.username,
                credential_ref=connection.credential_ref,
                authentication_type=connection.authentication_type,
            )

            result = executor.test_connection()

            status = "CONNECTED"
            message = result.stdout or "SSH connection established successfully."
            success = True

        except RemoteExecutionError as exc:
            status = "FAILED"
            message = str(exc)
            success = False

        connection.last_tested_at = tested_at
        connection.last_test_status = status
        connection.last_test_message = message

        self.db.commit()
        self.db.refresh(connection)

        return ConnectionTestResponse(
            success=success,
            status=status,
            message=message,
            tested_at=tested_at,
        )