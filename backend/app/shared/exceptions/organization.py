from app.shared.exceptions.base import AppException


class OrganizationAlreadyExists(AppException):
    """Generic conflict — kept for backwards compatibility."""

    def __init__(self):
        super().__init__(
            message="Organization already exists.",
            status_code=409,
        )


class OrganizationCodeTaken(AppException):
    """Raised when the requested organization code is already in use."""

    def __init__(self):
        super().__init__(
            message="An organization with this code already exists.",
            status_code=409,
        )


class OrganizationEmailTaken(AppException):
    """Raised when the requested e-mail is already registered to another organization."""

    def __init__(self):
        super().__init__(
            message="An organization with this e-mail already exists.",
            status_code=409,
        )


class OrganizationNotFound(AppException):
    """Raised when an organization lookup returns no result."""

    def __init__(self):
        super().__init__(
            message="Organization not found.",
            status_code=404,
        )


class OrganizationInactive(AppException):
    """Raised when an operation is attempted on a deactivated organization."""

    def __init__(self):
        super().__init__(
            message="Organization is inactive.",
            status_code=403,
        )