from app.shared.exceptions.base import AppException


class DeviceNotFound(AppException):
    def __init__(self):
        super().__init__(message="Device not found.", status_code=404)


class DeviceCodeTaken(AppException):
    def __init__(self):
        super().__init__(
            message="A device with this code already exists in this gateway.",
            status_code=409,
        )


class DeviceInactive(AppException):
    def __init__(self):
        super().__init__(message="Device is inactive.", status_code=403)
