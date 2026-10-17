"""
scripts/verify_customer_release.py

Customer Release Security & Verification Tool for Step 11.
Inspects release directories to ensure forbidden directories/files, vendor secrets,
private keys, development .env files, generated licenses, or hardcoded passwords do not enter customer release packages.
"""

from __future__ import annotations

import sys
from pathlib import Path

FORBIDDEN_NAMES = {
    ".git",
    ".venv",
    "venv",
    "node_modules",
    "__pycache__",
    ".pytest_cache",
    ".mypy_cache",
    ".ruff_cache",
    "vendor-tools",
}

FORBIDDEN_FILES = {
    ".env",
    "private.pem",
}

FORBIDDEN_EXTENSIONS = {
    ".lic",
    ".key",
    ".p12",
    ".pfx",
    ".csr",
    ".srl",
}

SENSITIVE_PATTERNS = {
    "-----BEGIN PRIVATE KEY-----",
    "-----BEGIN RSA PRIVATE KEY-----",
    "Password@123",
    "root123",
}


def check_text_file(path: Path) -> list[str]:
    findings = []
    # Skip binary files or archives
    if path.suffix.lower() in {".tar", ".gz", ".zip", ".png", ".jpg", ".ico", ".woff", ".woff2", ".ttf"}:
        return findings

    try:
        text = path.read_text(encoding="utf-8")
    except (UnicodeDecodeError, OSError):
        return findings

    for pattern in SENSITIVE_PATTERNS:
        if pattern in text:
            findings.append(f"Sensitive content pattern '{pattern}' found in {path.name}")

    return findings


def verify_release(root: Path) -> list[str]:
    errors: list[str] = []

    for path in root.rglob("*"):
        relative = path.relative_to(root)

        if any(part in FORBIDDEN_NAMES for part in relative.parts):
            errors.append(f"Forbidden directory/file: {relative}")

        if path.is_file():
            if path.name in FORBIDDEN_FILES:
                errors.append(f"Forbidden file: {relative}")

            if path.suffix.lower() in FORBIDDEN_EXTENSIONS:
                errors.append(f"Forbidden extension: {relative}")

            lower_name = path.name.lower()
            if "private" in lower_name and path.suffix.lower() in {".pem", ".key"}:
                errors.append(f"Private key candidate: {relative}")

            # Content scan
            file_findings = check_text_file(path)
            for finding in file_findings:
                errors.append(f"{finding} (file: {relative})")

    return sorted(set(errors))


def main() -> int:
    if len(sys.argv) != 2:
        print("Usage: python scripts/verify_customer_release.py <release-directory>")
        return 2

    root = Path(sys.argv[1]).resolve()

    if not root.exists():
        print(f"Release directory not found: {root}")
        return 2

    print(f"Verifying customer release directory: {root}")
    errors = verify_release(root)

    if errors:
        print("\nCUSTOMER RELEASE VERIFICATION FAILED:")
        for error in errors:
            print(f"  [FAIL] {error}")
        return 1

    print("\nCustomer release verification PASSED cleanly. Package is safe for release.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
