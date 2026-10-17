from typing import Optional
from sqlalchemy.orm import Session
from app.shared.repositories.base_repository import BaseRepository
from app.modules.users.models.user import User

from sqlalchemy import or_
from math import ceil
from app.modules.users.schemas.user import UserFilter

class UserRepository(BaseRepository[User]):
    def __init__(self):
        super().__init__(User)

    def get_by_email(self, db: Session, email: str) -> Optional[User]:
        return db.query(self.model).filter(self.model.email == email).first()

    def get_by_tenant(self, db: Session, tenant_id: str) -> list[User]:
        return db.query(self.model).filter(self.model.tenant_id == tenant_id).all()

    def list(
        self,
        db: Session,
        filters: UserFilter,
        tenant_id: Optional[str] = None,
        organization_id: Optional[str] = None
    ) -> dict:
        query = db.query(self.model)

        if organization_id:
            query = query.filter(self.model.organization_id == organization_id)
        elif tenant_id:
            query = query.filter(self.model.tenant_id == tenant_id)


        if filters.search:
            search_term = f"%{filters.search}%"
            query = query.filter(
                or_(
                    self.model.first_name.ilike(search_term),
                    self.model.last_name.ilike(search_term),
                    self.model.email.ilike(search_term)
                )
            )

        if filters.role:
            query = query.filter(self.model.role == filters.role)

        if filters.status:
            query = query.filter(self.model.status == filters.status)

        total = query.count()
        total_pages = ceil(total / filters.page_size) if total > 0 else 1
        
        offset = (filters.page - 1) * filters.page_size
        items = query.order_by(self.model.created_at.desc()).offset(offset).limit(filters.page_size).all()

        return {
            "items": items,
            "total": total,
            "page": filters.page,
            "page_size": filters.page_size,
            "total_pages": total_pages
        }
