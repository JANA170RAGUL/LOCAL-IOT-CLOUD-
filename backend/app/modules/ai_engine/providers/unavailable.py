"""
app/modules/ai_engine/providers/unavailable.py

Fallback AI provider when no production model is configured.
"""

from pathlib import Path
from app.modules.ai_engine.providers.base import AIModelProvider, PredictionResult


class ModelUnavailableError(RuntimeError):
    """Raised when inference is attempted on an unconfigured AI engine."""
    pass


class UnavailableAIProvider(AIModelProvider):
    """Fail-closed AI provider used when AI_PROVIDER='unavailable' or unconfigured."""

    def is_available(self) -> bool:
        return False

    def predict(self, image_path: Path) -> PredictionResult:
        raise ModelUnavailableError("AI inference model is not configured.")
