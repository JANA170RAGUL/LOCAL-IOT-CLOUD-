"""
app/modules/ai_engine/providers/__init__.py

Factory function to resolve active AI provider based on platform settings.
"""

from pathlib import Path
from app.config.settings import settings
from app.modules.ai_engine.providers.base import AIModelProvider, PredictionResult
from app.modules.ai_engine.providers.unavailable import UnavailableAIProvider, ModelUnavailableError
from app.modules.ai_engine.providers.mock import MockAIProvider
from app.modules.ai_engine.providers.onnx_provider import ONNXAIProvider


def get_ai_provider() -> AIModelProvider:
    """Instantiate and return the configured AI model provider."""
    provider_name = (settings.ai_provider or "unavailable").lower().strip()

    if provider_name == "onnx":
        model_path = Path(settings.ai_model_path)
        return ONNXAIProvider(
            model_path=model_path,
            expected_checksum=settings.ai_model_checksum or None,
        )
    elif provider_name == "mock":
        return MockAIProvider()
    else:
        return UnavailableAIProvider()


__all__ = [
    "AIModelProvider",
    "PredictionResult",
    "UnavailableAIProvider",
    "ModelUnavailableError",
    "MockAIProvider",
    "ONNXAIProvider",
    "get_ai_provider",
]
