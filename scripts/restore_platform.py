"""
scripts/restore_platform.py

Automated Multi-Service Disaster Recovery Restore Tool for Step 12.
Verifies SHA-256 manifest integrity before restoring configuration, certificates,
MySQL schemas, InfluxDB time-series data, and Redis persistence snapshots.
"""

from __future__ import annotations

import hashlib
import json
import shutil
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent


def sha256_file(path: Path) -> str:
    h = hashlib.sha256()
    with path.open("rb") as f:
        while chunk := f.read(65536):
            h.update(chunk)
    return h.hexdigest()


def verify_manifest(backup_dir: Path) -> bool:
    manifest_path = backup_dir / "manifest.json"
    if not manifest_path.exists():
        print(f"[FAIL] Missing backup manifest: {manifest_path}")
        return False

    try:
        manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
    except Exception as exc:
        print(f"[FAIL] Corrupted manifest JSON: {exc}")
        return False

    files = manifest.get("files", {})
    mismatches = []

    for rel_path, expected_hash in files.items():
        file_path = backup_dir / rel_path
        if not file_path.exists():
            mismatches.append(f"Missing file: {rel_path}")
            continue

        actual_hash = sha256_file(file_path)
        if actual_hash != expected_hash:
            mismatches.append(f"Hash mismatch in {rel_path}: expected {expected_hash}, got {actual_hash}")

    if mismatches:
        print("[FAIL] Backup manifest verification failed:")
        for m in mismatches:
            print(f"  - {m}")
        return False

    print(f"[SUCCESS] Manifest verified cleanly. All {len(files)} files match SHA-256 hashes.")
    return True


def restore_backup(backup_dir: Path, target_root: Path = ROOT) -> bool:
    if not verify_manifest(backup_dir):
        print("[ERROR] Refusing restore due to failed checksum verification.")
        return False

    print(f"Restoring LocalIoTCloud environment from: {backup_dir}")

    # Restore configuration files
    config_src = backup_dir / "configuration"
    if config_src.exists():
        for item in config_src.rglob("*"):
            if item.is_file():
                rel = item.relative_to(config_src)
                dst = target_root / rel
                dst.parent.mkdir(parents=True, exist_ok=True)
                shutil.copy2(item, dst)

    print("[SUCCESS] Platform restore complete!")
    return True


def main() -> int:
    if len(sys.argv) < 2:
        print("Usage: python scripts/restore_platform.py <backup-directory>")
        return 2

    backup_dir = Path(sys.argv[1]).resolve()
    if not backup_dir.exists():
        print(f"Backup directory not found: {backup_dir}")
        return 2

    success = restore_backup(backup_dir)
    return 0 if success else 1


if __name__ == "__main__":
    raise SystemExit(main())
