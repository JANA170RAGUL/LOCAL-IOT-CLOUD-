from typing import Generic, TypeVar, Type

from sqlalchemy import func, select
from sqlalchemy.orm import Session

ModelType = TypeVar("ModelType")


class BaseRepository(Generic[ModelType]):

    def __init__(self, model: Type[ModelType]):
        self.model = model

    def create(self, db: Session, obj: ModelType):
        db.add(obj)
        db.commit()
        db.refresh(obj)
        return obj

    def get_by_id(self, db: Session, obj_id):
        return db.get(self.model, obj_id)

    def get_all(self, db: Session):
        stmt = select(self.model)
        return db.scalars(stmt).all()

    def update(self, db: Session, obj: ModelType):
        db.commit()
        db.refresh(obj)
        return obj

    def delete(self, db: Session, obj: ModelType):
        db.delete(obj)
        db.commit()

    def count(self, db: Session) -> int:
        stmt = select(func.count()).select_from(self.model)
        return db.scalar(stmt)

    def paginate(
        self,
        db: Session,
        page: int,
        page_size: int,
    ):
        stmt = (
            select(self.model)
            .offset((page - 1) * page_size)
            .limit(page_size)
        )

        items = db.scalars(stmt).all()
        total = self.count(db)

        return items, total