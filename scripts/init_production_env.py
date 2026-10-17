"""
scripts/init_production_env.py

Production Environment Secret Initializer for Step 12.
Generates strong cryptographically secure installation keys and peppers in production `.env`.
Refuses execution if `.env` already exists to prevent key overwrites during upgrades.
"""

from __future__ import annotations

import secrets
import sys
from pathlib import Path
from cryptography.fernet import Fernet

ROOT = Path(__file__).resolve().parent.parent
DEFAULT_EXAMPLE = ROOT / "deployment" / "production" / ".env.example"
DEFAULT_OUTPUT = ROOT / "deployment" / "production" / ".env"


def random_secret(length: int = 48) -> str:
    return secrets.token_urlsafe(length)


def init_env(example_path: Path = DEFAULT_EXAMPLE, output_path: Path = DEFAULT_OUTPUT) -> bool:
    if output_path.exists():
        print(f"[WARN] Refusing to overwrite existing file: {output_path}")
        print("Existing installation secrets must be preserved across upgrades.")
        return False

    if not example_path.exists():
        print(f"[ERROR] Template file not found: {example_path}")
        return False

    text = example_path.read_text(encoding="utf-8")

    replacements = {
        "SECRET_KEY=": f"SECRET_KEY={random_secret()}",
        "JWT_SECRET_KEY=": f"JWT_SECRET_KEY={random_secret()}",
        "REFRESH_TOKEN_PEPPER=": f"REFRESH_TOKEN_PEPPER={random_secret()}",
        "DEVICE_CREDENTIAL_PEPPER=": f"DEVICE_CREDENTIAL_PEPPER={random_secret()}",
        "CHANNEL_API_KEY_PEPPER=": f"CHANNEL_API_KEY_PEPPER={random_secret()}",
        "WEBHOOK_ENCRYPTION_KEY=": f"WEBHOOK_ENCRYPTION_KEY={Fernet.generate_key().decode()}",
    }

    lines = []
    for line in text.splitlines():
        replaced = False
        for prefix, value in replacements.items():
            if line == prefix:
                lines.append(value)
                replaced = True
                break
        if not replaced:
            lines.append(line)

    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text("\n".join(lines) + "\n", encoding="utf-8")
    print(f"[SUCCESS] Created production environment file: {output_path}")
    print("Remember to set database, Redis, MQTT, and InfluxDB passwords before launching container services.")
    return True


def main() -> int:
    example_path = Path(sys.argv[1]).resolve() if len(sys.argv) > 1 else DEFAULT_EXAMPLE
    output_path = Path(sys.argv[2]).resolve() if len(sys.argv) > 2 else DEFAULT_OUTPUT
    success = init_env(example_path=example_path, output_path=output_path)
    return 0 if success else 1


if __name__ == "__main__":
    raise SystemExit(main())
