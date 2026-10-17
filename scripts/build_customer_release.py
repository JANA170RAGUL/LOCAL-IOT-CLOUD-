"""
scripts/build_customer_release.py

Customer Release Allowlist Builder for Step 11.
Assembles a production customer release package in `release/LocalIoTCloud-<version>/`.
Strictly enforces file allowlisting and exclusion of dev/sensitive files (.git, .venv, node_modules, private keys, .env, vendor-tools).
Generates RELEASE-MANIFEST.json with SHA-256 file checksums and executes verification.
"""

from __future__ import annotations

import hashlib
import json
import os
import shutil
import sys
from datetime import datetime, timezone
from pathlib import Path

# Explicit directory ignore list
IGNORE_DIRS = {
    ".git",
    ".github",
    ".vscode",
    ".venv",
    "venv",
    "node_modules",
    "__pycache__",
    ".pytest_cache",
    ".mypy_cache",
    ".ruff_cache",
    "vendor-tools",
    "backups",
    "release",
    "dist",
    "build",
}

# Explicit file ignore list / patterns
IGNORE_EXACT_FILES = {
    ".env",
    ".env.development",
    ".env.local",
    ".env.test",
    "private.pem",
    "vyphera_groups.lic",
}

IGNORE_EXTENSIONS = {
    ".lic",
    ".key",
    ".p12",
    ".pfx",
    ".csr",
    ".srl",
    ".pyc",
    ".pyo",
}


def file_sha256(path: Path) -> str:
    h = hashlib.sha256()
    with path.open("rb") as f:
        while chunk := f.read(65536):
            h.update(chunk)
    return h.hexdigest()


def should_include(path: Path, root: Path) -> bool:
    rel = path.relative_to(root)

    # Check directory parts
    for part in rel.parts:
        if part in IGNORE_DIRS:
            return False

    if path.is_file():
        if path.name in IGNORE_EXACT_FILES:
            return False
        if path.suffix.lower() in IGNORE_EXTENSIONS:
            return False
        if "private" in path.name.lower() and path.suffix.lower() in {".pem", ".key"}:
            return False
        if path.name.startswith("validate_") and path.suffix == ".py":
            return False

    return True


def copy_allowlisted(src: Path, dst: Path, project_root: Path) -> list[tuple[Path, Path]]:
    copied = []
    if not src.exists():
        return copied

    if src.is_file():
        if should_include(src, project_root):
            dst.parent.mkdir(parents=True, exist_ok=True)
            shutil.copy2(src, dst)
            copied.append((src, dst))
        return copied

    for root_dir, dirs, files in os.walk(src):
        # Mutate dirs in-place to skip ignored directories
        dirs[:] = [d for d in dirs if d not in IGNORE_DIRS]

        rel_root = Path(root_dir).relative_to(project_root)
        if any(part in IGNORE_DIRS for part in rel_root.parts):
            continue

        for file in files:
            file_path = Path(root_dir) / file
            if should_include(file_path, project_root):
                target_rel = file_path.relative_to(project_root)
                target_path = dst / target_rel.relative_to(src.relative_to(project_root))
                target_path.parent.mkdir(parents=True, exist_ok=True)
                shutil.copy2(file_path, target_path)
                copied.append((file_path, target_path))

    return copied


def main() -> int:
    project_root = Path(__file__).resolve().parent.parent

    # Version discovery
    if len(sys.argv) > 1:
        version = sys.argv[1].strip()
    else:
        version_file = project_root / "VERSION"
        if version_file.exists():
            version = version_file.read_text(encoding="utf-8").strip()
        else:
            version = "1.0.0"

    release_name = f"LocalIoTCloud-{version}"
    release_dir = project_root / "release" / release_name

    print(f"Building Customer Release Package: {release_name}")
    print(f"Target Directory: {release_dir}")

    # Reset release directory if exists
    if release_dir.exists():
        print(f"Cleaning existing directory: {release_dir}")
        shutil.rmtree(release_dir)

    release_dir.mkdir(parents=True, exist_ok=True)

    # Core source targets to copy
    targets = [
        "VERSION",
        "README.md",
        "BACKEND_API_DOCUMENTATION.md",
        "docker-compose.yml",
        "deployment",
        "backend",
        "frontend",
        "mosquitto",
        "docs",
    ]

    total_copied: list[tuple[Path, Path]] = []
    for item in targets:
        src_path = project_root / item
        if not src_path.exists():
            continue
        dst_path = release_dir / item
        copied = copy_allowlisted(src_path, dst_path, project_root)
        total_copied.extend(copied)

    print(f"Copied {len(total_copied)} allowlisted files into release package.")

    # Generate RELEASE-MANIFEST.json
    manifest_path = release_dir / "RELEASE-MANIFEST.json"
    file_hashes: dict[str, str] = {}

    for _, dst_file in total_copied:
        rel_to_release = dst_file.relative_to(release_dir).as_posix()
        file_hashes[rel_to_release] = file_sha256(dst_file)

    manifest_data = {
        "product": "LocalIoTCloud",
        "version": version,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "total_files": len(file_hashes),
        "files": dict(sorted(file_hashes.items())),
    }

    manifest_path.write_text(json.dumps(manifest_data, indent=2), encoding="utf-8")
    print(f"Generated RELEASE-MANIFEST.json with {len(file_hashes)} file checksums.")

    # Verify release package using verify_customer_release.py
    verifier_script = project_root / "scripts" / "verify_customer_release.py"
    if verifier_script.exists():
        print("\nInvoking customer release verification check...")
        import subprocess

        res = subprocess.run(
            [sys.executable, str(verifier_script), str(release_dir)],
            capture_output=True,
            text=True,
        )
        print(res.stdout)
        if res.returncode != 0:
            print(res.stderr)
            print("\n[ERROR] Customer release verification failed!")
            return 1

    zip_path = shutil.make_archive(
        base_name=str(release_dir),
        format="zip",
        root_dir=str(release_dir.parent),
        base_dir=release_name,
    )
    print(f"\n[SUCCESS] Customer release package & archive created successfully:")
    print(f"  Directory: {release_dir}")
    print(f"  Archive:   {zip_path}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
