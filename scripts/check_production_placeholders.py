#!/usr/bin/env python3
"""
scripts/check_production_placeholders.py

Release scan script searching backend/app and frontend/src for forbidden production mock patterns.
"""

import sys
import re
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parent.parent
BACKEND_APP = ROOT_DIR / "backend" / "app"
FRONTEND_SRC = ROOT_DIR / "frontend" / "src"

# Forbidden patterns in production runtime files
BANNED_PATTERNS = [
    (r"Math\.random\(", "Forbidden Math.random() found in frontend component"),
    (r"random\.uniform\(", "Suspicious random.uniform() in backend app"),
    (r"random\.randint\(", "Suspicious random.randint() in backend app"),
    (r"TODO_PRODUCTION", "Unresolved TODO_PRODUCTION marker found"),
    (r"FAKE_DATA", "Fake data marker found"),
]

ALLOWLIST_FILES = {
    # Security random token generators
    "security.py",
    "jwt.py",
    "password.py",
    "websocket_ticket_service.py",
}


def scan_file(path: Path) -> list[str]:
    if path.name in ALLOWLIST_FILES:
        return []

    errors = []
    try:
        content = path.read_text(encoding="utf-8", errors="ignore")
        for line_no, line in enumerate(content.splitlines(), start=1):
            for pattern, msg in BANNED_PATTERNS:
                if re.search(pattern, line):
                    errors.append(f"{path.relative_to(ROOT_DIR)}:{line_no}: {msg} -> '{line.strip()}'")
    except Exception as e:
        errors.append(f"Failed to read {path}: {e}")

    return errors


def main() -> int:
    print("============================================================")
    print(" LocalIoTCloud - Production Placeholder & Mock Scan")
    print("============================================================")

    scan_targets = []
    if BACKEND_APP.exists():
        scan_targets.extend(BACKEND_APP.rglob("*.py"))
    if FRONTEND_SRC.exists():
        scan_targets.extend(FRONTEND_SRC.rglob("*.ts"))
        scan_targets.extend(FRONTEND_SRC.rglob("*.tsx"))

    all_errors = []
    for file_path in scan_targets:
        if "__pycache__" in str(file_path):
            continue
        errors = scan_file(file_path)
        all_errors.extend(errors)

    if all_errors:
        print("\n[FAIL] Banned production markers found:")
        for err in all_errors:
            print(f"  - {err}")
        return 1

    print("\n[OK] Zero forbidden production placeholders or random fallbacks found.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
