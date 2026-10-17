import hashlib
import hmac
import secrets

from app.config.settings import settings


def generate_refresh_token() -> tuple[str, str]:
    token_id = secrets.token_urlsafe(16)
    secret = secrets.token_urlsafe(48)
    raw_token = f"liot_ref_{token_id}.{secret}"
    return token_id, raw_token


def parse_refresh_token(raw_token: str) -> tuple[str, str]:
    prefix = "liot_ref_"
    if not raw_token or not raw_token.startswith(prefix):
        raise ValueError("Invalid refresh token.")

    body = raw_token[len(prefix):]
    try:
        token_id, secret = body.split(".", 1)
    except ValueError as exc:
        raise ValueError("Invalid refresh token.") from exc

    if not token_id or not secret:
        raise ValueError("Invalid refresh token.")

    return token_id, secret


def hash_refresh_secret(secret: str) -> str:
    return hmac.new(
        settings.refresh_token_pepper.encode(),
        secret.encode(),
        hashlib.sha256,
    ).hexdigest()


def verify_refresh_secret(secret: str, expected_hash: str) -> bool:
    if not secret or not expected_hash:
        return False
    actual = hash_refresh_secret(secret)
    return hmac.compare_digest(actual, expected_hash)
