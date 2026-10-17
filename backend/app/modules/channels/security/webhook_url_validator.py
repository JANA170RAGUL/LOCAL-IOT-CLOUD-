import ipaddress
import socket
from urllib.parse import urlparse
from fastapi import HTTPException, status

from app.config.settings import settings


def _is_forbidden_ip(ip_string: str) -> bool:
    try:
        ip = ipaddress.ip_address(ip_string)
        return any(
            (
                ip.is_private,
                ip.is_loopback,
                ip.is_link_local,
                ip.is_multicast,
                ip.is_reserved,
                ip.is_unspecified,
            )
        )
    except ValueError:
        return True


def validate_webhook_url(url: str, allow_http_dev: bool = True) -> None:
    if not url:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Webhook URL is required.",
        )

    parsed = urlparse(url)

    # In production HTTPS is strictly required. In development allow_http_dev is respected.
    if settings.is_production and parsed.scheme != "https":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Webhook URL must use HTTPS.",
        )

    if parsed.scheme not in {"http", "https"}:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid webhook URL protocol.",
        )

    if not parsed.hostname:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid webhook URL hostname.",
        )

    hostname = parsed.hostname.lower()

    if hostname in {"localhost", "localhost.localdomain"}:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Internal webhook URLs are not allowed.",
        )

    port = parsed.port or (443 if parsed.scheme == "https" else 80)

    try:
        records = socket.getaddrinfo(
            hostname,
            port,
            type=socket.SOCK_STREAM,
        )
    except socket.gaierror:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Webhook hostname could not be resolved.",
        )

    addresses = {record[4][0] for record in records if record and len(record) >= 5}

    if not addresses:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid webhook host resolution.",
        )

    for address in addresses:
        if _is_forbidden_ip(address):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Webhook target resolves to a forbidden network address.",
            )
