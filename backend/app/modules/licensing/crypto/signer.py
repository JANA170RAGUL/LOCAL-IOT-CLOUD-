import json
import base64
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.asymmetric import padding
from app.modules.licensing.crypto.rsa_keys import get_private_key

def sign_license(license_payload: dict) -> str:
    """
    Takes a raw license dictionary (without signature), signs it,
    and returns the Base64 signature string.
    """
    # Deterministic serialization
    payload_str = json.dumps(license_payload, sort_keys=True, separators=(',', ':'))
    payload_bytes = payload_str.encode('utf-8')
    
    private_key = get_private_key()
    
    signature = private_key.sign(
        payload_bytes,
        padding.PKCS1v15(),
        hashes.SHA256()
    )
    
    return base64.b64encode(signature).decode('utf-8')
