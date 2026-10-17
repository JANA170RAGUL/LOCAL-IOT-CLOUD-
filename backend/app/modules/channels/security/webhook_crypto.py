import base64
from typing import Optional
from cryptography.fernet import Fernet, InvalidToken
from app.config.settings import settings


def _get_fernet() -> Fernet:
    raw_key = getattr(settings, "webhook_encryption_key", "")
    if not raw_key:
        raw_key = Fernet.generate_key().decode()

    # Ensure 32-byte base64 key
    try:
        key_bytes = raw_key.encode()
        return Fernet(key_bytes)
    except Exception:
        # Fallback to deterministic key derived from secret_key if malformed
        digest = base64.urlsafe_b64encode(settings.secret_key.encode().ljust(32)[:32])
        return Fernet(digest)


def encrypt_secret(value: Optional[str]) -> Optional[str]:
    if not value:
        return None
    fernet = _get_fernet()
    return fernet.encrypt(value.encode()).decode()


def decrypt_secret(value: Optional[str]) -> Optional[str]:
    if not value:
        return None
    fernet = _get_fernet()
    try:
        return fernet.decrypt(value.encode()).decode()
    except InvalidToken as exc:
        raise RuntimeError("Webhook secret cannot be decrypted.") from exc
