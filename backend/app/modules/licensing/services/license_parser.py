import json
from datetime import datetime
from fastapi import HTTPException, status
from app.modules.licensing.crypto.verifier import verify_signature

def parse_and_validate_license(raw_license_content: str) -> dict:
    """
    Parses a raw `.lic` string, verifies its RSA signature, checks its structure,
    and returns the license payload dictionary if valid.
    """
    try:
        data = json.loads(raw_license_content)
    except json.JSONDecodeError:
        raise HTTPException(status_code=400, detail="Invalid license file format (not JSON).")
        
    signature = data.get("signature")
    if not signature:
        raise HTTPException(status_code=400, detail="License file is missing a digital signature.")
        
    # Remove signature for verification
    payload = data.copy()
    del payload["signature"]
    
    # Verify RSA signature
    is_valid = verify_signature(payload, signature)
    if not is_valid:
        raise HTTPException(status_code=403, detail="Invalid license signature. File may have been tampered with or issued by an untrusted vendor.")
        
    # Check basic schema fields
    required_fields = ["customer", "license_key", "plan", "expires", "machine", "features"]
    for field in required_fields:
        if field not in payload:
            raise HTTPException(status_code=400, detail=f"License file is missing required field: {field}")
            
    # Check expiry
    try:
        # Expecting ISO 8601 string or similar, e.g. "2030-12-31T23:59:59Z" or just date "2030-12-31"
        expires_str = payload["expires"]
        if "T" not in expires_str:
            expires_str += "T23:59:59Z"
        # simplistic parsing for python 3.11 fromisoformat handles most if cleaned
        expires_at = datetime.fromisoformat(expires_str.replace("Z", "+00:00"))
        
        if expires_at < datetime.now(expires_at.tzinfo):
            raise HTTPException(status_code=403, detail="This license has already expired.")
            
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid expiry date format in license.")
        
    # Return full validated data with signature intact
    return data
