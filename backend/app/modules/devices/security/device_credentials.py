import hashlib
import hmac
import secrets

from app.config.settings import settings


DEVICE_KEY_PREFIX = "liot_dvc"


def generate_key_id() -> str:
    """
    Public identifier used to locate the credential.

    This value is NOT secret.
    """
    return secrets.token_urlsafe(12)


def generate_secret() -> str:
    """
    Cryptographically secure device secret.
    """
    return secrets.token_urlsafe(32)


def hash_device_secret(secret: str) -> str:
    """
    Produce a deterministic HMAC-SHA256 digest.

    The secret itself is never stored.
    """
    return hmac.new(
        settings.device_credential_pepper.encode("utf-8"),
        secret.encode("utf-8"),
        hashlib.sha256,
    ).hexdigest()


def verify_device_secret(
    secret: str,
    expected_hash: str,
) -> bool:

    calculated_hash = hash_device_secret(secret)

    return hmac.compare_digest(
        calculated_hash,
        expected_hash,
    )


def build_device_key(
    key_id: str,
    secret: str,
) -> str:
    """
    Full credential returned once to the user/device.
    """

    return f"{DEVICE_KEY_PREFIX}_{key_id}.{secret}"


def parse_device_key(
    raw_key: str,
) -> tuple[str, str]:
    """
    Example:

    liot_dvc_ABC123.xyz-secret

    becomes:

    ("ABC123", "xyz-secret")
    """

    expected_prefix = f"{DEVICE_KEY_PREFIX}_"

    if not raw_key.startswith(expected_prefix):
        raise ValueError("Invalid device credential format.")

    credential = raw_key[len(expected_prefix):]

    try:
        key_id, secret = credential.split(".", 1)
    except ValueError as exc:
        raise ValueError(
            "Invalid device credential format."
        ) from exc

    if not key_id or not secret:
        raise ValueError(
            "Invalid device credential format."
        )

    return key_id, secret
