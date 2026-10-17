import os

from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.backends import default_backend


KEYS_DIR = os.path.join(
    os.path.dirname(__file__),
    "keys",
)

PUBLIC_KEY_PATH = os.getenv(
    "LICENSE_PUBLIC_KEY_PATH",
    os.path.join(KEYS_DIR, "public.pem"),
)


def get_public_key():
    if not os.path.exists(PUBLIC_KEY_PATH):
        raise RuntimeError(
            f"License public key not found: {PUBLIC_KEY_PATH}"
        )

    with open(PUBLIC_KEY_PATH, "rb") as key_file:
        return serialization.load_pem_public_key(
            key_file.read(),
            backend=default_backend(),
        )