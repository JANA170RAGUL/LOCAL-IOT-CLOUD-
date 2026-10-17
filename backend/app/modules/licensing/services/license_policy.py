"""
app/modules/licensing/services/license_policy.py

Authoritative License Policy Service for LocalIoTCloud.
Evaluates RSA signed license payload, machine binding, date bounds, grace periods,
and clock rollback detection with a thread-safe 30-second process-local cache.
Provides centralized operational, feature flag, and numeric capacity guards.
"""

from __future__ import annotations

import hmac
import json
import logging
import threading
import time
from datetime import datetime, timedelta, timezone
from typing import Any

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.config.settings import settings
from app.database.redis import get_redis_client
from app.modules.licensing.crypto.verifier import verify_signature
from app.modules.licensing.features import FEATURE_DEFINITIONS, FeatureKind, LicenseFeature
from app.modules.licensing.models.license import License
from app.modules.licensing.policy.models import (
    ALLOWED_IN_RESTRICTED,
    LicenseMode,
    LicenseOperation,
    LicenseRecordStatus,
    LicenseSnapshot,
)
from app.modules.licensing.validators.machine_validator import validate_machine

logger = logging.getLogger(__name__)

LICENSE_POLICY_CACHE_SECONDS = 30
CLOCK_ROLLBACK_TOLERANCE_SECONDS = 600


class LicensePolicyService:
    def __init__(self):
        self._lock = threading.Lock()
        self._snapshot: LicenseSnapshot | None = None
        self._expires_monotonic: float = 0.0

    def invalidate(self) -> None:
        with self._lock:
            self._snapshot = None
            self._expires_monotonic = 0.0

    def get_snapshot(self, db: Session) -> LicenseSnapshot:
        now_mono = time.monotonic()
        with self._lock:
            if self._snapshot and now_mono < self._expires_monotonic:
                return self._snapshot

            snapshot = self.evaluate(db)
            self._snapshot = snapshot
            self._expires_monotonic = now_mono + LICENSE_POLICY_CACHE_SECONDS
            return snapshot

    def _check_clock_rollback(self, now: datetime) -> bool:
        """
        Detects system clock backward shifts greater than CLOCK_ROLLBACK_TOLERANCE_SECONDS.
        Uses HMAC verified Redis state.
        """
        try:
            r = get_redis_client()
            key_name = "license:runtime_clock_state"
            data = r.get(key_name)
            pepper = settings.secret_key.encode("utf-8")

            if data:
                if isinstance(data, bytes):
                    data = data.decode("utf-8")
                parts = data.split("|")
                if len(parts) == 2:
                    last_ts_str, expected_mac = parts
                    last_ts = float(last_ts_str)
                    mac = hmac.new(pepper, last_ts_str.encode("utf-8"), "sha256").hexdigest()

                    if hmac.compare_digest(mac, expected_mac):
                        if now.timestamp() < (last_ts - CLOCK_ROLLBACK_TOLERANCE_SECONDS):
                            logger.error(
                                f"System clock rollback detected! Current: {now.timestamp()}, Last seen: {last_ts}"
                            )
                            return True

            # Update last seen timestamp with HMAC
            now_ts_str = str(now.timestamp())
            mac = hmac.new(pepper, now_ts_str.encode("utf-8"), "sha256").hexdigest()
            r.set(key_name, f"{now_ts_str}|{mac}")
        except Exception as exc:
            logger.warning(f"Clock rollback check fallback: {exc}")

        return False

    def _dev_fallback_snapshot(self) -> LicenseSnapshot:
        return LicenseSnapshot(
            mode=LicenseMode.VALID,
            plan="DEVELOPMENT",
            features={
                "organizations": 100,
                "users": 100,
                "gateways": 100,
                "devices": 1000,
                "dashboards": 100,
                "widgets": 1000,
                "channels": 100,
                "telemetry_rate": 10000,
                "analytics": True,
                "reports": True,
                "remote_commands": True,
                "ai": True,
            },
            reason="Development/Testing default license mode.",
        )

    def evaluate(self, db: Session) -> LicenseSnapshot:
        is_dev_env = settings.app_env.lower() in {"testing", "test", "development", "dev"}

        license_obj = db.scalar(
            select(License)
            .where(License.status == LicenseRecordStatus.ACTIVE.value)
            .order_by(License.created_at.desc())
        )

        if not license_obj or not license_obj.raw_license_file:
            if is_dev_env:
                return self._dev_fallback_snapshot()
            return LicenseSnapshot(
                mode=LicenseMode.UNLICENSED,
                reason="No active license found in system.",
            )

        # Parse JSON and verify RSA signature
        try:
            payload = json.loads(license_obj.raw_license_file)
            signature = payload.pop("signature", "")
            if not verify_signature(payload, signature):
                if is_dev_env:
                    return self._dev_fallback_snapshot()
                return LicenseSnapshot(
                    mode=LicenseMode.INVALID,
                    reason="License signature validation failed.",
                )
        except Exception as exc:
            if is_dev_env:
                return self._dev_fallback_snapshot()
            return LicenseSnapshot(
                mode=LicenseMode.INVALID,
                reason=f"Corrupted license payload: {exc}",
            )

        # Validate machine binding
        machine_code = payload.get("machine", "")
        if not validate_machine(machine_code):
            if is_dev_env:
                return self._dev_fallback_snapshot()
            return LicenseSnapshot(
                mode=LicenseMode.INVALID,
                reason="Machine binding fingerprint mismatch.",
            )

        now = datetime.now(timezone.utc)

        # Clock rollback check
        if self._check_clock_rollback(now):
            return LicenseSnapshot(
                mode=LicenseMode.CLOCK_ROLLBACK,
                reason="System clock rollback detected.",
            )

        # Parse date limits
        try:
            not_before = datetime.fromisoformat(payload["not_before"].replace("Z", "+00:00"))
            expires_at = datetime.fromisoformat(payload["expires_at"].replace("Z", "+00:00"))
        except (KeyError, ValueError) as err:
            if is_dev_env:
                return self._dev_fallback_snapshot()
            return LicenseSnapshot(
                mode=LicenseMode.INVALID,
                reason=f"Invalid license date metadata: {err}",
            )

        if not_before.tzinfo is None:
            not_before = not_before.replace(tzinfo=timezone.utc)
        if expires_at.tzinfo is None:
            expires_at = expires_at.replace(tzinfo=timezone.utc)

        grace_days = int(payload.get("grace_days", 0))
        grace_ends_at = expires_at + timedelta(days=grace_days)

        if now < not_before:
            return LicenseSnapshot(
                mode=LicenseMode.INVALID,
                reason="License is not valid yet.",
            )

        if now <= expires_at:
            mode = LicenseMode.VALID
        elif now <= grace_ends_at:
            mode = LicenseMode.GRACE
        else:
            mode = LicenseMode.RESTRICTED

        features = payload.get("features", {})

        return LicenseSnapshot(
            mode=mode,
            license_id=payload.get("license_id"),
            plan=payload.get("plan"),
            expires_at=expires_at,
            grace_ends_at=grace_ends_at,
            features=features,
        )

    def ensure_operation(
        self,
        snapshot: LicenseSnapshot,
        operation: LicenseOperation,
    ) -> None:
        if snapshot.mode in {LicenseMode.VALID, LicenseMode.GRACE}:
            return

        if operation in ALLOWED_IN_RESTRICTED:
            return

        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Operation unavailable under current license mode.",
        )

    def ensure_feature(
        self,
        snapshot: LicenseSnapshot,
        feature: LicenseFeature,
    ) -> None:
        self.ensure_operation(snapshot, LicenseOperation.PREMIUM_FEATURE)

        value = snapshot.features.get(feature.value)

        # Missing feature fails closed
        if type(value) is not bool or not value:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Feature '{feature.value}' is not licensed under current plan.",
            )

    def ensure_capacity(
        self,
        snapshot: LicenseSnapshot,
        feature: LicenseFeature,
        *,
        current_count: int,
        delta: int = 1,
    ) -> None:
        self.ensure_operation(snapshot, LicenseOperation.RESOURCE_CREATE)

        value = snapshot.features.get(feature.value)

        if type(value) is not int:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Resource '{feature.value}' limit is not defined in license.",
            )

        # -1 = Unlimited
        if value == -1:
            return

        if value < 0:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Invalid license capacity limit for '{feature.value}'.",
            )

        if current_count + delta > value:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"License capacity limit reached for {feature.value}. Maximum allowed: {value}.",
            )


license_policy = LicensePolicyService()
