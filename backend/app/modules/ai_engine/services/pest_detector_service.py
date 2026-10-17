"""
app/modules/ai_engine/services/pest_detector_service.py

Service layer wrapper for pest detection AI engine.
Delegates to configured AIModelProvider (ONNX, Mock, or Unavailable).
"""

from pathlib import Path
from typing import Dict, Any, Optional

from app.config.settings import settings
from app.modules.ai_engine.providers import get_ai_provider, ModelUnavailableError


class PestDetectionEngine:
    def get_status(self) -> Dict[str, Any]:
        provider = get_ai_provider()
        available = provider.is_available()
        return {
            "engine_id": 31,
            "engine_name": "Pest Detection Engine",
            "status": "Running" if available else "Unavailable",
            "is_live": available,
            "provider": settings.ai_provider,
            "model_file": settings.ai_model_path,
            "model_object_loaded": available,
        }

    def predict(self, image_path: Optional[Path] = None) -> Dict[str, Any]:
        provider = get_ai_provider()
        if not provider.is_available():
            raise ModelUnavailableError("AI model is not configured.")

        target_file = image_path or Path("ai_models/sample.jpg")
        res = provider.predict(target_file)
        return {
            "status": "SUCCESS",
            "engine": "Pest Detection Engine (#31)",
            "label": res.label,
            "confidence": res.confidence,
            "model_name": res.model_name,
            "model_version": res.model_version,
            "predictions": res.detections,
            "metadata": res.metadata,
        }


pest_detection_engine = PestDetectionEngine()
