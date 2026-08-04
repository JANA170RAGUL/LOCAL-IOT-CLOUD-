"""
app/core/security.py

Authentication and cryptographic utilities for the platform.
"""

from __future__ import annotations

import secrets
import string

from app.core.constants import API_KEY_LENGTH

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
