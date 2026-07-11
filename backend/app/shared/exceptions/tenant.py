from app.shared.exceptions.base import AppException


class TenantNotFound(AppException):
    def __init__(self):
        super().__init__(message="Tenant not found.", status_code=404)


class TenantCodeTaken(AppException):
    def __init__(self):
        super().__init__(
            message="A tenant with this code already exists in this organization.",
            status_code=409,
        )


class TenantEmailTaken(AppException):
    def __init__(self):
        super().__init__(
            message="A tenant with this e-mail already exists.",
            status_code=409,
        )


class TenantInactive(AppException):
    def __init__(self):
        super().__init__(message="Tenant is inactive.", status_code=403)
