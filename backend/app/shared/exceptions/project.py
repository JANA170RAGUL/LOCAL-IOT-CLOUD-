from app.shared.exceptions.base import AppException


class ProjectNotFound(AppException):
    def __init__(self):
        super().__init__(message="Project not found.", status_code=404)


class ProjectCodeTaken(AppException):
    def __init__(self):
        super().__init__(
            message="A project with this code already exists in this tenant.",
            status_code=409,
        )


class ProjectInactive(AppException):
    def __init__(self):
        super().__init__(message="Project is inactive.", status_code=403)
