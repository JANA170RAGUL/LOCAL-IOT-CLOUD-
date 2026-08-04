import json
import base64
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.asymmetric import padding
from app.modules.licensing.crypto.rsa_keys import get_public_key

def verify_signature(license_payload: dict, signature_b64: str) -> bool:
    """
    Verifies the RSA signature of a license payload.
    The payload must NOT contain the "signature" key during verification.
    """
    try:
        # 1. Ensure deterministic serialization
        # Sort keys to ensure the exact same string is produced as during signing
        payload_str = json.dumps(license_payload, sort_keys=True, separators=(',', ':'))
        payload_bytes = payload_str.encode('utf-8')
        
        # 2. Decode the signature
        signature_bytes = base64.b64decode(signature_b64)
        
        # 3. Get the embedded public key
        public_key = get_public_key()
        
        # 4. Verify
        public_key.verify(
            signature_bytes,
            payload_bytes,
            padding.PKCS1v15(),
            hashes.SHA256()
        )
        return True
    except Exception as e:
        # Verification failed
        return False
