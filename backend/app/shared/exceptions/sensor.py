from app.shared.exceptions.base import AppException


class SensorNotFound(AppException):
    def __init__(self):
        super().__init__(message="Sensor not found.", status_code=404)


class SensorCodeTaken(AppException):
    def __init__(self):
        super().__init__(
            message="A sensor with this code already exists in this device.",
            status_code=409,
        )


class SensorInactive(AppException):
    def __init__(self):
        super().__init__(message="Sensor is inactive.", status_code=403)
