import json
import base64
import os
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.asymmetric import padding
from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.backends import default_backend

def get_private_key():
    base_dir = os.path.dirname(os.path.dirname(__file__))
    priv_path = os.path.join(base_dir, "keys", "private.pem")
    
    with open(priv_path, "rb") as key_file:
        return serialization.load_pem_private_key(
            key_file.read(),
            password=None,
            backend=default_backend()
        )

def sign_payload(payload: dict) -> str:
    """
    Serializes a dictionary deterministically and signs it with RSA-SHA256.
    Returns the Base64 encoded signature.
    """
    # Important: sort_keys=True ensures the payload string matches exactly what the backend verifier will reconstruct
    payload_str = json.dumps(payload, sort_keys=True, separators=(',', ':'))
    payload_bytes = payload_str.encode('utf-8')
    
    private_key = get_private_key()
    
    signature_bytes = private_key.sign(
        payload_bytes,
        padding.PKCS1v15(),
        hashes.SHA256()
    )
    
    return base64.b64encode(signature_bytes).decode('utf-8')
