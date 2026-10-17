from datetime import datetime, timedelta, timezone
from typing import Optional
from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.modules.channels.models.channel import ChannelApiKey
from app.modules.channels.security.api_keys import parse_api_key, verify_secret


def _ensure_utc(dt: Optional[datetime]) -> Optional[datetime]:
    if dt is None:
        return None
    if dt.tzinfo is None:
        return dt.replace(tzinfo=timezone.utc)
    return dt


class ChannelKeyAuthenticator:

    @staticmethod
    def authenticate(
        db: Session,
        raw_key: str,
        required_type: Optional[str] = None,
    ) -> ChannelApiKey:
        if not raw_key:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Missing Channel API key.",
            )

        credential = None
        key_type = None

        try:
            key_type, key_id, secret = parse_api_key(raw_key)
            credential = db.scalar(
                select(ChannelApiKey).where(
                    ChannelApiKey.key_id == key_id,
                    ChannelApiKey.is_active.is_(True),
                    ChannelApiKey.revoked_at.is_(None),
                )
            )
            if credential and not verify_secret(secret, credential.key_hash):
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Invalid Channel API key secret.",
                )
        except ValueError:
            # Fall back to matching raw_key directly against api_key or key_id column
            credential = db.scalar(
                select(ChannelApiKey).where(
                    (ChannelApiKey.api_key == raw_key) | (ChannelApiKey.key_id == raw_key),
                    ChannelApiKey.is_active.is_(True),
                    ChannelApiKey.revoked_at.is_(None),
                )
            )

        if credential is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid Channel API key.",
            )

        db_type = (
            credential.key_type.value
            if hasattr(credential.key_type, "value")
            else str(credential.key_type).upper()
        )
        if key_type and db_type.upper() != key_type.upper():
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid Channel API key type.",
            )

        if required_type and db_type.upper() != required_type.upper():
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="API key does not have the required permission.",
            )

        now = datetime.now(timezone.utc)

        exp_utc = _ensure_utc(credential.expires_at)
        if exp_utc and exp_utc <= now:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Channel API key expired.",
            )

        if not verify_secret(secret, credential.key_hash):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid Channel API key secret.",
            )

        # Update last_used_at throttled (at most once every 5 minutes)
        last_used_utc = _ensure_utc(credential.last_used_at)
        if last_used_utc is None or last_used_utc < now - timedelta(minutes=5):
            credential.last_used_at = now
            db.commit()

        return credential
