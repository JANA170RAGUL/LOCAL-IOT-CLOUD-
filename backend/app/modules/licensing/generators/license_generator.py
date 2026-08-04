import json
import argparse
from datetime import datetime, timedelta, timezone

from app.modules.licensing.crypto.signer import sign_license
from app.modules.licensing.crypto.rsa_keys import ensure_keys_exist
from app.modules.licensing.services.fingerprint_service import generate_fingerprint

def generate_test_license(output_file: str = "test_license.lic"):
    """
    Generates a cryptographically valid test license for the local machine.
    """
    ensure_keys_exist()
    
    # Get current machine fingerprint so the license works locally
    machine_data = generate_fingerprint()
    
    expiry_date = datetime.now(timezone.utc) + timedelta(days=365)
    
    payload = {
        "customer": "Test Corp",
        "license_key": "TEST-1234-ABCD",
        "plan": "Enterprise",
        "expires": expiry_date.strftime("%Y-%m-%dT%H:%M:%SZ"),
        "machine": machine_data["fingerprint_hash"],
        "features": {
            "devices": 5000,
            "dashboards": -1, # Unlimited
            "analytics": True,
            "ai": False,
            "reports": True
        }
    }
    
    # Sign it
    signature = sign_license(payload)
    payload["signature"] = signature
    
    # Write to file
    with open(output_file, "w") as f:
        json.dump(payload, f, indent=2)
        
    print(f"Generated test license: {output_file}")
    print(f"Bound to machine fingerprint: {machine_data['fingerprint_hash']}")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Generate a test license for the local machine.")
    parser.add_argument("--output", default="test_license.lic", help="Output file path")
    args = parser.parse_args()
    generate_test_license(args.output)
