"""
Generate the LocalIoTCloud Root CA, MQTT certificate and HTTPS certificate.

Examples:
    py generate_certificates.py --help

    py generate_certificates.py \
        --server-ip 150.50.170.2 \
        --hostname iot-server \
        --force
"""

import argparse
import ipaddress
import os
import re
import shutil
import subprocess
import sys
from datetime import datetime
from pathlib import Path


BASE_DIR = Path(__file__).resolve().parent.parent
CERTS_DIR = BASE_DIR / "certificates"
CA_DIR = CERTS_DIR / "ca"
MQTT_DIR = CERTS_DIR / "mqtt"
HTTPS_DIR = CERTS_DIR / "https"


def find_openssl() -> str:
    """Locate a usable OpenSSL executable."""

    candidates = []

    system_openssl = shutil.which("openssl")
    if system_openssl:
        candidates.append(Path(system_openssl))

    git_path = shutil.which("git")
    if git_path:
        git_root = Path(git_path).resolve().parent.parent
        candidates.append(git_root / "usr" / "bin" / "openssl.exe")

    local_app_data = os.getenv("LOCALAPPDATA")
    if local_app_data:
        candidates.append(
            Path(local_app_data)
            / "Programs"
            / "Git"
            / "usr"
            / "bin"
            / "openssl.exe"
        )

    candidates.append(
        Path(r"C:\Program Files\Git\usr\bin\openssl.exe")
    )

    for candidate in candidates:
        if candidate.exists():
            return str(candidate)

    raise FileNotFoundError(
        "OpenSSL was not found. Install Git for Windows or OpenSSL."
    )


def run_cmd(command: list[str]) -> str:
    """Run a command and stop if it fails."""

    print("Running:", " ".join(command))

    result = subprocess.run(
        command,
        capture_output=True,
        text=True,
    )

    if result.returncode != 0:
        raise RuntimeError(
            "Command failed.\n"
            f"STDOUT:\n{result.stdout}\n"
            f"STDERR:\n{result.stderr}"
        )

    if result.stdout.strip():
        print(result.stdout.strip())

    return result.stdout


def validate_hostname(hostname: str) -> str:
    """Reject unsafe values before placing them in OpenSSL configuration."""

    hostname = hostname.strip()

    valid = re.fullmatch(
        r"[A-Za-z0-9](?:[A-Za-z0-9.-]{0,251}[A-Za-z0-9])?",
        hostname,
    )

    if not valid:
        raise ValueError(f"Invalid hostname: {hostname}")

    return hostname


def backup_existing_certificates() -> Path | None:
    """Create a timestamped backup before overwriting certificates."""

    if not CERTS_DIR.exists():
        return None

    if not any(path.is_file() for path in CERTS_DIR.rglob("*")):
        return None

    timestamp = datetime.now().strftime("%Y%m%d-%H%M%S")
    backup_dir = BASE_DIR / f"certificates-backup-{timestamp}"

    shutil.copytree(CERTS_DIR, backup_dir)

    print(f"[OK] Existing certificates backed up to: {backup_dir}")
    return backup_dir


def write_server_config(
    config_path: Path,
    hostname: str,
    server_ip: str,
) -> None:
    """Write an OpenSSL configuration for a server certificate."""

    config_content = f"""[req]
distinguished_name = req_distinguished_name
req_extensions = req_ext
prompt = no

[req_distinguished_name]
C = IN
O = LocalIoTCloud
CN = {hostname}

[req_ext]
subjectAltName = @alt_names

[server_ext]
basicConstraints = critical, CA:FALSE
keyUsage = critical, digitalSignature, keyEncipherment
extendedKeyUsage = serverAuth
subjectKeyIdentifier = hash
authorityKeyIdentifier = keyid,issuer
subjectAltName = @alt_names

[alt_names]
DNS.1 = {hostname}
DNS.2 = localhost
IP.1 = {server_ip}
IP.2 = 127.0.0.1
"""

    config_path.write_text(config_content, encoding="utf-8")


def generate_server_certificate(
    openssl: str,
    name: str,
    directory: Path,
    config_path: Path,
    private_key: Path,
    certificate_request: Path,
    certificate: Path,
    ca_key: Path,
    ca_certificate: Path,
) -> None:
    """Generate and sign one server certificate."""

    run_cmd([
        openssl,
        "genrsa",
        "-out",
        str(private_key),
        "2048",
    ])

    run_cmd([
        openssl,
        "req",
        "-new",
        "-key",
        str(private_key),
        "-out",
        str(certificate_request),
        "-config",
        str(config_path),
    ])

    run_cmd([
        openssl,
        "x509",
        "-req",
        "-in",
        str(certificate_request),
        "-CA",
        str(ca_certificate),
        "-CAkey",
        str(ca_key),
        "-CAcreateserial",
        "-out",
        str(certificate),
        "-days",
        "825",
        "-sha256",
        "-extensions",
        "server_ext",
        "-extfile",
        str(config_path),
    ])

    print(f"[OK] {name} server certificate generated.")


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Generate LocalIoTCloud TLS certificates safely."
    )

    parser.add_argument(
        "--server-ip",
        required=True,
        help="Static IP used by LocalIoTCloud clients.",
    )

    parser.add_argument(
        "--hostname",
        default="iot-server",
        help="DNS hostname included in the certificates.",
    )

    parser.add_argument(
        "--force",
        action="store_true",
        help="Back up and overwrite existing certificates.",
    )

    args = parser.parse_args()

    server_ip = str(ipaddress.ip_address(args.server_ip))
    hostname = validate_hostname(args.hostname)
    openssl = find_openssl()

    for directory in [CA_DIR, MQTT_DIR, HTTPS_DIR]:
        directory.mkdir(parents=True, exist_ok=True)

    ca_key = CA_DIR / "localiot-ca.key"
    ca_certificate = CA_DIR / "localiot-ca.crt"
    ca_config = CA_DIR / "localiot-ca.cnf"

    mqtt_key = MQTT_DIR / "mqtt-server.key"
    mqtt_request = MQTT_DIR / "mqtt-server.csr"
    mqtt_certificate = MQTT_DIR / "mqtt-server.crt"
    mqtt_config = MQTT_DIR / "mqtt-san.cnf"

    https_key = HTTPS_DIR / "https-server.key"
    https_request = HTTPS_DIR / "https-server.csr"
    https_certificate = HTTPS_DIR / "https-server.crt"
    https_config = HTTPS_DIR / "https-san.cnf"

    generated_outputs = [
        ca_certificate,
        mqtt_key,
        mqtt_certificate,
        https_key,
        https_certificate,
    ]

    existing_outputs = [
        path for path in generated_outputs if path.exists()
    ]

    if existing_outputs and not args.force:
        print(
            "Existing certificates were found. "
            "No files were modified."
        )
        print(
            "Use --force only when certificate replacement "
            "is intentional."
        )
        return 2

    if existing_outputs:
        backup_existing_certificates()

    # Keep the existing private CA key when available.
    # This avoids unnecessary CA private-key rotation.
    if not ca_key.exists():
        run_cmd([
            openssl,
            "genrsa",
            "-out",
            str(ca_key),
            "4096",
        ])
        print("[OK] New Root CA private key generated.")
    else:
        print("[OK] Existing Root CA private key retained.")

    ca_config_content = """[req]
distinguished_name = distinguished_name
x509_extensions = v3_ca
prompt = no

[distinguished_name]
C = IN
O = LocalIoTCloud
CN = LocalIoTCloud Root CA

[v3_ca]
basicConstraints = critical, CA:TRUE
keyUsage = critical, keyCertSign, cRLSign
subjectKeyIdentifier = hash
authorityKeyIdentifier = keyid:always,issuer
"""

    ca_config.write_text(ca_config_content, encoding="utf-8")

    run_cmd([
        openssl,
        "req",
        "-x509",
        "-new",
        "-key",
        str(ca_key),
        "-sha256",
        "-days",
        "3650",
        "-out",
        str(ca_certificate),
        "-config",
        str(ca_config),
        "-extensions",
        "v3_ca",
    ])

    print("[OK] Root CA certificate generated with CA Key Usage.")

    write_server_config(mqtt_config, hostname, server_ip)
    write_server_config(https_config, hostname, server_ip)

    generate_server_certificate(
        openssl=openssl,
        name="MQTT",
        directory=MQTT_DIR,
        config_path=mqtt_config,
        private_key=mqtt_key,
        certificate_request=mqtt_request,
        certificate=mqtt_certificate,
        ca_key=ca_key,
        ca_certificate=ca_certificate,
    )

    generate_server_certificate(
        openssl=openssl,
        name="HTTPS",
        directory=HTTPS_DIR,
        config_path=https_config,
        private_key=https_key,
        certificate_request=https_request,
        certificate=https_certificate,
        ca_key=ca_key,
        ca_certificate=ca_certificate,
    )

    # Strict validation catches malformed CA and server extensions.
    run_cmd([
        openssl,
        "verify",
        "-x509_strict",
        "-CAfile",
        str(ca_certificate),
        str(ca_certificate),
    ])

    run_cmd([
        openssl,
        "verify",
        "-x509_strict",
        "-CAfile",
        str(ca_certificate),
        "-purpose",
        "sslserver",
        "-verify_hostname",
        hostname,
        str(https_certificate),
    ])

    run_cmd([
        openssl,
        "verify",
        "-x509_strict",
        "-CAfile",
        str(ca_certificate),
        "-purpose",
        "sslserver",
        "-verify_ip",
        server_ip,
        str(https_certificate),
    ])

    run_cmd([
        openssl,
        "verify",
        "-x509_strict",
        "-CAfile",
        str(ca_certificate),
        "-purpose",
        "sslserver",
        "-verify_hostname",
        hostname,
        str(mqtt_certificate),
    ])

    print()
    print("[OK] Certificate generation and strict validation passed.")
    print(f"Hostname: {hostname}")
    print(f"Server IP: {server_ip}")
    print(f"Public CA: {ca_certificate}")
    print("Keep all .key files private.")

    return 0


if __name__ == "__main__":
    sys.exit(main())