from datetime import datetime, timedelta, timezone
from typing import Optional, List, Tuple
from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.config.settings import settings
from app.modules.auth.models.user_session import UserSession
from app.modules.auth.security.refresh_tokens import (
    generate_refresh_token,
    hash_refresh_secret,
    parse_refresh_token,
    verify_refresh_secret,
)


def _ensure_utc(dt: Optional[datetime]) -> Optional[datetime]:
    if dt is None:
        return None
    if dt.tzinfo is None:
        return dt.replace(tzinfo=timezone.utc)
    return dt


class SessionService:

    @staticmethod
    def create(
        db: Session,
        *,
        user_id: str,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None,
    ) -> Tuple[UserSession, str]:
        token_id, raw_token = generate_refresh_token()
        _, secret = parse_refresh_token(raw_token)
        now = datetime.now(timezone.utc)

        session = UserSession(
            user_id=user_id,
            token_id=token_id,
            refresh_token_hash=hash_refresh_secret(secret),
            expires_at=now + timedelta(days=settings.refresh_token_expire_days),
            ip_address=ip_address,
            user_agent=user_agent,
            last_used_at=now,
        )

        db.add(session)
        db.commit()
        db.refresh(session)

        return session, raw_token

    @staticmethod
    def authenticate_refresh_token(
        db: Session,
        raw_token: str,
    ) -> UserSession:
        try:
            token_id, secret = parse_refresh_token(raw_token)
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid refresh token.",
            )

        session = db.scalar(
            select(UserSession).where(
                UserSession.token_id == token_id,
            )
        )

        if session is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid refresh token.",
            )

        if session.revoked_at:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Session revoked.",
            )

        now = datetime.now(timezone.utc)
        exp_utc = _ensure_utc(session.expires_at)
        if exp_utc and exp_utc <= now:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Session expired.",
            )

        if not verify_refresh_secret(secret, session.refresh_token_hash):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid refresh token.",
            )

        if not session.user or not session.user.is_active or session.user.status != "ACTIVE":
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User account inactive.",
            )

        return session

    @staticmethod
    def rotate(
        db: Session,
        session: UserSession,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None,
    ) -> Tuple[UserSession, str]:
        now = datetime.now(timezone.utc)
        session.revoked_at = now
        session.revoke_reason = "Refresh token rotated"

        db.add(session)
        db.commit()

        return SessionService.create(
            db,
            user_id=session.user_id,
            ip_address=ip_address or session.ip_address,
            user_agent=user_agent or session.user_agent,
        )

    @staticmethod
    def revoke_all_user_sessions(
        db: Session,
        user_id: str,
        reason: str = "Sessions revoked",
    ) -> int:
        sessions = db.scalars(
            select(UserSession).where(
                UserSession.user_id == user_id,
                UserSession.revoked_at.is_(None),
            )
        ).all()

        now = datetime.now(timezone.utc)
        count = 0
        for s in sessions:
            s.revoked_at = now
            s.revoke_reason = reason
            count += 1

        if count > 0:
            db.commit()

        return count
