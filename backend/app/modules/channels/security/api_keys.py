import hashlib
import hmac
import secrets

from app.config.settings import settings

READ_PREFIX = "liot_ch_r"
WRITE_PREFIX = "liot_ch_w"


def generate_key_id() -> str:
    return secrets.token_urlsafe(10)


def generate_secret() -> str:
    return secrets.token_urlsafe(32)


def hash_secret(secret: str) -> str:
    pepper = getattr(settings, "channel_api_key_pepper", "default-channel-pepper-change-in-production-0987654321")
    return hmac.new(
        pepper.encode(),
        secret.encode(),
        hashlib.sha256,
    ).hexdigest()


def verify_secret(secret: str, expected_hash: str) -> bool:
    actual = hash_secret(secret)
    return hmac.compare_digest(actual, expected_hash)


def build_api_key(*, key_id: str, secret: str, key_type: str) -> str:
    norm_type = str(key_type).upper()
    if norm_type == "READ":
        prefix = READ_PREFIX
    elif norm_type == "WRITE":
        prefix = WRITE_PREFIX
    else:
        raise ValueError("Invalid Channel API key type.")

    return f"{prefix}_{key_id}.{secret}"


def parse_api_key(raw_key: str) -> tuple[str, str, str]:
    raw_key = (raw_key or "").strip()

    if raw_key.startswith(f"{READ_PREFIX}_"):
        key_type = "READ"
        body = raw_key[len(READ_PREFIX) + 1 :]
    elif raw_key.startswith(f"{WRITE_PREFIX}_"):
        key_type = "WRITE"
        body = raw_key[len(WRITE_PREFIX) + 1 :]
    else:
        raise ValueError("Invalid Channel API key.")

    try:
        key_id, secret = body.split(".", 1)
    except ValueError as exc:
        raise ValueError("Invalid Channel API key.") from exc

    if not key_id or not secret:
        raise ValueError("Invalid Channel API key.")

    return key_type, key_id, secret
