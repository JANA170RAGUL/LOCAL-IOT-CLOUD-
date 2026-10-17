from app.shared.exceptions.base import AppException


class ProvisioningJobNotFound(AppException):
    def __init__(self):
        super().__init__(message="Provisioning job not found.", status_code=404)


class DeviceAgentNotFound(AppException):
    def __init__(self):
        super().__init__(message="Device agent not found.", status_code=404)


class DeviceConnectionNotFound(AppException):
    def __init__(self):
        super().__init__(message="Device connection not found.", status_code=404)


class HardwareComponentNotFound(AppException):
    def __init__(self):
        super().__init__(message="Hardware component not found.", status_code=404)


class ProvisioningJobAlreadyCompleted(AppException):
    def __init__(self):
        super().__init__(
            message="Provisioning job has already reached a final state (COMPLETED, FAILED, or CANCELLED).",
            status_code=400,
        )
