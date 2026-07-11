"""
app/core/security.py

Authentication and cryptographic utilities for the platform.

Responsibilities
----------------
- Password hashing and verification (bcrypt via passlib)
- JWT access-token and refresh-token creation
- JWT decoding and validation
- API key generation

Usage
-----
    from app.core.security import (
        hash_password, verify_password,
        create_access_token, decode_access_token,
        generate_api_key,
    )
"""

from __future__ import annotations

import secrets
import string
from datetime import datetime, timedelta, timezone
from typing import Any

from jose import JWTError, jwt
from passlib.context import CryptContext

from app.config.settings import settings
from app.core.constants import API_KEY_LENGTH, TokenType
from app.core.exceptions import InvalidTokenError

# ---------------------------------------------------------------------------
# Password hashing
# ---------------------------------------------------------------------------

# passlib 1.7.4 + bcrypt 5.x have a known incompatibility (removed __about__).
# sha256_crypt is the primary scheme; bcrypt is kept as a deprecated fallback
# so any pre-existing bcrypt hashes can still be verified and will be
# automatically re-hashed to sha256_crypt on the next successful login.
_pwd_context = CryptContext(
    schemes=["sha256_crypt", "bcrypt"],
    deprecated=["bcrypt"],          # auto-upgrade bcrypt hashes → sha256_crypt
    sha256_crypt__rounds=200_000,   # NIST-recommended work factor
)


def hash_password(plain_password: str) -> str:
    """Return a bcrypt hash of ``plain_password``."""
    return _pwd_context.hash(plain_password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Return ``True`` if ``plain_password`` matches ``hashed_password``.
    Uses constant-time comparison internally to prevent timing attacks.
    """
    return _pwd_context.verify(plain_password, hashed_password)


# ---------------------------------------------------------------------------
# JWT tokens
# ---------------------------------------------------------------------------

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
    """
    Create a short-lived JWT access token.

    Parameters
    ----------
    subject:
        Unique identifier for the principal (e.g. user UUID).
    extra_claims:
        Additional payload data (e.g. ``{"role": "tenant_admin",
        "tenant_id": "..."}``.

    Returns
    -------
    str
        Signed JWT string.
    """
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
    """
    Create a long-lived JWT refresh token.

    Refresh tokens should be stored server-side (Redis) and rotated on
    each use to implement refresh-token rotation.
    """
    return _build_token(
        subject=subject,
        token_type=TokenType.REFRESH,
        expires_delta=timedelta(days=settings.refresh_token_expire_days),
        extra_claims=extra_claims,
    )


def decode_token(token: str) -> dict[str, Any]:
    """
    Decode and validate a JWT.

    Raises
    ------
    InvalidTokenError
        If the token is expired, malformed, or the signature is invalid.

    Returns
    -------
    dict
        The verified token payload.
    """
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
    """
    Decode a JWT and assert it is an access token.

    Raises
    ------
    InvalidTokenError
        If decoding fails or the ``type`` claim is not ``"access"``.
    """
    payload = decode_token(token)
    if payload.get("type") != TokenType.ACCESS.value:
        raise InvalidTokenError("Expected an access token.")
    return payload


def decode_refresh_token(token: str) -> dict[str, Any]:
    """
    Decode a JWT and assert it is a refresh token.

    Raises
    ------
    InvalidTokenError
        If decoding fails or the ``type`` claim is not ``"refresh"``.
    """
    payload = decode_token(token)
    if payload.get("type") != TokenType.REFRESH.value:
        raise InvalidTokenError("Expected a refresh token.")
    return payload


def get_token_subject(token: str) -> str:
    """
    Convenience helper – decode a token and return only the ``sub`` claim.

    Raises
    ------
    InvalidTokenError
        If the token is invalid or the subject is missing.
    """
    payload = decode_token(token)
    subject: str | None = payload.get("sub")
    if not subject:
        raise InvalidTokenError("Token is missing the subject claim.")
    return subject


# ---------------------------------------------------------------------------
# API key generation
# ---------------------------------------------------------------------------

_API_KEY_ALPHABET = string.ascii_letters + string.digits


def generate_api_key(prefix: str = "lic") -> str:
    """
    Generate a cryptographically secure API key.

    Format: ``<prefix>_<random_chars>``
    Example: ``lic_aB3xZ9kqTm...``

    Parameters
    ----------
    prefix:
        Short human-readable prefix to identify the key type
        (e.g. ``"dev"`` for a device key, ``"usr"`` for a user key).

    Returns
    -------
    str
        Unpredictable API key string.
    """
    random_part = "".join(
        secrets.choice(_API_KEY_ALPHABET) for _ in range(API_KEY_LENGTH)
    )
    return f"{prefix}_{random_part}"


def generate_activation_token() -> str:
    """
    Generate a URL-safe random token for email verification / password reset.

    Returns a 64-character hex string (32 bytes of entropy).
    """
    return secrets.token_hex(32)


# ---------------------------------------------------------------------------
# Bearer token extraction helper (used in middleware / dependencies)
# ---------------------------------------------------------------------------

def extract_bearer_token(authorization_header: str | None) -> str:
    """
    Parse the ``Authorization: Bearer <token>`` header.

    Raises
    ------
    InvalidTokenError
        If the header is missing or not in Bearer format.
    """
    if not authorization_header:
        raise InvalidTokenError("Authorization header is missing.")
    parts = authorization_header.split()
    if len(parts) != 2 or parts[0].lower() != "bearer":
        raise InvalidTokenError(
            "Authorization header must be in 'Bearer <token>' format."
        )
    return parts[1]
