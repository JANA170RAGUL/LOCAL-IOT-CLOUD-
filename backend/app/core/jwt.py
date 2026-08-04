"""
app/core/jwt.py

JWT access-token and refresh-token creation, decoding, and validation.
"""

from datetime import datetime, timedelta, timezone
from typing import Any

from jose import JWTError, jwt

from app.config.settings import settings
from app.core.constants import TokenType
from app.core.exceptions import InvalidTokenError


def _build_token(
    subject: str,
    token_type: TokenType,
    expires_delta: timedelta,
    extra_claims: dict[str, Any] | None = None,
) -> str:
    """Internal helper – construct and sign a JWT."""
    now = datetime.now(timezone.utc)
    payload: dict[str, Any] = {
        "sub": subject,           # subject (usually user_id)
        "type": token_type.value,
        "iat": now,               # issued-at
        "exp": now + expires_delta,
    }
    if extra_claims:
        payload.update(extra_claims)

    return jwt.encode(
        payload,
        settings.jwt_secret_key,
        algorithm=settings.jwt_algorithm,
    )


def create_access_token(
    subject: str,
    extra_claims: dict[str, Any] | None = None,
) -> str:
    return _build_token(
        subject=subject,
        token_type=TokenType.ACCESS,
        expires_delta=timedelta(minutes=settings.access_token_expire_minutes),
        extra_claims=extra_claims,
    )


def create_refresh_token(
    subject: str,
    extra_claims: dict[str, Any] | None = None,
) -> str:
    return _build_token(
        subject=subject,
        token_type=TokenType.REFRESH,
        expires_delta=timedelta(days=settings.refresh_token_expire_days),
        extra_claims=extra_claims,
    )


def decode_token(token: str) -> dict[str, Any]:
    try:
        payload = jwt.decode(
            token,
            settings.jwt_secret_key,
            algorithms=[settings.jwt_algorithm],
        )
        return payload
    except JWTError as exc:
        raise InvalidTokenError() from exc


def decode_access_token(token: str) -> dict[str, Any]:
    payload = decode_token(token)
    if payload.get("type") != TokenType.ACCESS.value:
        raise InvalidTokenError("Expected an access token.")
    return payload


def decode_refresh_token(token: str) -> dict[str, Any]:
    payload = decode_token(token)
    if payload.get("type") != TokenType.REFRESH.value:
        raise InvalidTokenError("Expected a refresh token.")
    return payload


def get_token_subject(token: str) -> str:
    payload = decode_token(token)
    subject: str | None = payload.get("sub")
    if not subject:
        raise InvalidTokenError("Token is missing the subject claim.")
    return subject

def extract_bearer_token(authorization_header: str | None) -> str:
    if not authorization_header:
        raise InvalidTokenError("Authorization header is missing.")
    parts = authorization_header.split()
    if len(parts) != 2 or parts[0].lower() != "bearer":
        raise InvalidTokenError(
            "Authorization header must be in 'Bearer <token>' format."
        )
    return parts[1]
