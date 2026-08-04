import uuid
import json
import os
from datetime import datetime
from services.signer import sign_payload

def generate_license(
    customer_name: str,
    company: str,
    email: str,
    plan: str,
    expires_at: str, # ISO8601 string
    machine_fingerprint: str,
    features: dict
) -> dict:
    """
    Constructs the license payload, signs it, and returns the final dictionary.
    """
    license_key = f"LIC-{str(uuid.uuid4()).upper()[:16]}"
    
    payload = {
        "customer": customer_name,
        "company": company,
        "email": email,
        "license_key": license_key,
        "plan": plan,
        "expires": expires_at,
        "machine": machine_fingerprint,
        "features": features
    }
    
    signature = sign_payload(payload)
    
    # The final format is the exact payload, plus the signature appended.
    final_license = payload.copy()
    final_license["signature"] = signature
    
    return final_license

def save_license_file(final_license: dict, customer_name: str) -> str:
    """
    Saves the final license to a .lic file in the output directory.
    """
    base_dir = os.path.dirname(os.path.dirname(__file__))
    safe_name = customer_name.replace(" ", "_").lower()
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    
    file_name = f"{safe_name}_{timestamp}.lic"
    file_path = os.path.join(base_dir, "output", file_name)
    
    with open(file_path, "w") as f:
        json.dump(final_license, f, indent=2)
        
    return file_path
