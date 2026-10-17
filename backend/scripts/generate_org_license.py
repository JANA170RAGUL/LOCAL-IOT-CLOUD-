import sys
import os
import json
import argparse
from datetime import datetime, timedelta, timezone

# Add backend directory to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.modules.licensing.crypto.signer import sign_license
from app.modules.licensing.crypto.rsa_keys import ensure_keys_exist
from app.modules.licensing.services.fingerprint_service import generate_fingerprint


def generate_organization_license(
    customer_name: str,
    plan: str = "Enterprise",
    days_valid: int = 365,
    machine_fingerprint: str | None = None,
    output_file: str = "org_license.lic",
):
    """
    Generates a cryptographically RSA-signed `.lic` file for a specific Organization and machine fingerprint.
    """
    ensure_keys_exist()

    # If no fingerprint provided, auto-detect local machine fingerprint
    if not machine_fingerprint:
        machine_data = generate_fingerprint()
        machine_fingerprint = machine_data["fingerprint_hash"]

    expiry_date = datetime.now(timezone.utc) + timedelta(days=days_valid)
    license_key = f"LIC-{customer_name.upper().replace(' ', '_')[:8]}-{datetime.now().strftime('%Y%m%d%H%M')}"

    payload = {
        "customer": customer_name,
        "license_key": license_key,
        "plan": plan,
        "expires": expiry_date.strftime("%Y-%m-%dT%H:%M:%SZ"),
        "machine": machine_fingerprint,
        "features": {
            "devices": -1 if plan == "Enterprise" else 500,
            "gateways": -1 if plan == "Enterprise" else 50,
            "dashboards": -1,
            "analytics": True,
            "ai": True if plan == "Enterprise" else False,
            "reports": True,
        },
    }

    # Generate SHA-256 RSA Signature
    signature = sign_license(payload)
    payload["signature"] = signature

    # Save .lic file
    with open(output_file, "w") as f:
        json.dump(payload, f, indent=2)

    print("=" * 60)
    print(" LICENSE GENERATED SUCCESSFULLY")
    print("=" * 60)
    print(f" Customer:            {customer_name}")
    print(f" License Key:         {license_key}")
    print(f" Plan:                {plan}")
    print(f" Machine Fingerprint: {machine_fingerprint}")
    print(f" Valid Until:         {expiry_date.strftime('%Y-%m-%d %H:%M:%S UTC')} ({days_valid} days)")
    print(f" Output File:         {output_file}")
    print("=" * 60)
    return output_file


if __name__ == "__main__":
    parser = argparse.ArgumentParser(
        description="Generate cryptographically signed license file for an Organization."
    )
    parser.add_argument(
        "--customer",
        default="VYPHERA_GROUPS",
        help="Organization or Customer Name (default: VYPHERA_GROUPS)",
    )
    parser.add_argument(
        "--plan",
        default="Enterprise",
        choices=["Community", "Professional", "Enterprise"],
        help="License Plan Tier",
    )
    parser.add_argument(
        "--days", type=int, default=365, help="Validity duration in days"
    )
    parser.add_argument(
        "--fingerprint",
        default=None,
        help="Machine fingerprint hash (optional, defaults to local server)",
    )
    parser.add_argument(
        "--output", default="vyphera_groups.lic", help="Output .lic filepath"
    )

    args = parser.parse_args()

    generate_organization_license(
        customer_name=args.customer,
        plan=args.plan,
        days_valid=args.days,
        machine_fingerprint=args.fingerprint,
        output_file=args.output,
    )
