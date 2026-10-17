"""
app/modules/ai_engine/providers/mock.py

Development-only mock AI provider for frontend UI testing.
Strictly disabled when ALLOW_DEMO_DATA=False or APP_ENV=production.
"""

from pathlib import Path
from app.core.environment import demo_data_allowed
from app.modules.ai_engine.providers.base import AIModelProvider, PredictionResult


class MockAIProvider(AIModelProvider):
    """Mock AI provider for development/testing environments."""

    def __init__(self) -> None:
        if not demo_data_allowed():
            raise RuntimeError(
                "Mock AI provider is disabled in production or when ALLOW_DEMO_DATA is False."
            )

    def is_available(self) -> bool:
        return True

    def predict(self, image_path: Path) -> PredictionResult:
        return PredictionResult(
            label="rice leaf roller",
            confidence=0.94,
            model_name="mock-pest-detector",
            model_version="0.1.0-dev",
            metadata={"environment": "development-mock"},
            detections=[
                {
                    "class_id": 1,
                    "pest_name": "rice leaf roller",
                    "confidence": 0.94,
                    "bbox": [100, 50, 300, 250],
                }
            ],
        )
