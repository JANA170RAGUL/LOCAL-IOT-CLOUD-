from typing import Generic, TypeVar

from sqlalchemy.orm import Session

ModelType = TypeVar("ModelType")
RepositoryType = TypeVar("RepositoryType")


class BaseService(Generic[ModelType, RepositoryType]):

    def __init__(self, repository: RepositoryType):
        self.repository = repository

    def get_by_id(self, db: Session, obj_id):
        return self.repository.get_by_id(db, obj_id)

    def get_all(self, db: Session):
        return self.repository.get_all(db)

    def create(self, db: Session, obj):
        return self.repository.create(db, obj)

    def update(self, db: Session, obj):
        return self.repository.update(db, obj)

    def delete(self, db: Session, obj):
        return self.repository.delete(db, obj)

    def list(
        self,
        db: Session,
        page: int = 1,
        page_size: int = 20,
    ):
        return self.repository.paginate(db, page, page_size)