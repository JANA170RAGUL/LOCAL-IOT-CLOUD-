"""
app/core/production_checks.py

Startup checks for production integrity.
Fails application startup if dangerous development/demo/mock configurations
are active when APP_ENV is production.
"""

from app.config.settings import settings


def run_production_checks() -> None:
    """Validate that production environment has no active demo, mock, or debug flags."""
    if settings.app_env != "production":
        return

    errors = []

    if settings.debug:
        errors.append("DEBUG must be False in production.")

    if settings.allow_demo_data:
        errors.append("ALLOW_DEMO_DATA cannot be enabled in production.")

    if settings.allow_simulators:
        errors.append("ALLOW_SIMULATORS cannot be enabled in production.")

    if settings.ai_provider == "mock":
        errors.append("Mock AI provider (AI_PROVIDER=mock) cannot run in production.")

    if settings.notification_provider == "console":
        errors.append("Console notification provider (NOTIFICATION_PROVIDER=console) cannot run in production.")

    if errors:
        raise RuntimeError(
            "Invalid production configuration:\n- " + "\n- ".join(errors)
        )
