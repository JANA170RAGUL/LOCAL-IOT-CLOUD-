from app.shared.exceptions.base import AppException


class GatewayNotFound(AppException):
    def __init__(self):
        super().__init__(message="Gateway not found.", status_code=404)


class GatewayCodeTaken(AppException):
    def __init__(self):
        super().__init__(
            message="A gateway with this code already exists in this project.",
            status_code=409,
        )


class GatewayInactive(AppException):
    def __init__(self):
        super().__init__(message="Gateway is inactive.", status_code=403)
