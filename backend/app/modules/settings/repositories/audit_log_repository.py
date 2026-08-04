from sqlalchemy.orm import Session
from sqlalchemy import desc
from app.modules.administration.models.audit_log import AuditLog
from app.modules.settings.schemas.audit import AuditLogCreate
from typing import List, Tuple

class AuditLogRepository:
    def __init__(self, db: Session):
        self.db = db

    def create(self, log_in: AuditLogCreate) -> AuditLog:
        log = AuditLog(**log_in.model_dump())
        self.db.add(log)
        self.db.commit()
        self.db.refresh(log)
        return log

    def list(self, skip: int = 0, limit: int = 100) -> Tuple[List[AuditLog], int]:
        query = self.db.query(AuditLog)
        total = query.count()
        logs = query.order_by(desc(AuditLog.created_at)).offset(skip).limit(limit).all()
        return logs, total
