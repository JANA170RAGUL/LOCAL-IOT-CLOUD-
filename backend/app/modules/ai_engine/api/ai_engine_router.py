"""
app/modules/ai_engine/api/ai_engine_router.py

Pest detection and AI inference endpoints for LocalIoTCloud.
Enforces feature licensing and HTTP 503 when AI model is unconfigured.
"""

from pathlib import Path
import tempfile
import shutil
from typing import Dict, Any

from fastapi import APIRouter, HTTPException, UploadFile, File

from app.config.settings import settings
from app.modules.ai_engine.providers import get_ai_provider, ModelUnavailableError
from app.modules.licensing.features import LicenseFeature
from app.modules.licensing.services.license_policy import LicensePolicyService

router = APIRouter(prefix="/ai-engine", tags=["AI Engine"])


@router.get("/pest-detection/status")
def get_pest_detection_status() -> Dict[str, Any]:
    """Check connectivity and model load status for Pest Detection Engine (#31)."""
    provider = get_ai_provider()
    available = provider.is_available()
    return {
        "engine_id": 31,
        "engine_name": "Pest Detection Engine",
        "status": "Running" if available else "Unavailable",
        "is_live": available,
        "provider": settings.ai_provider,
        "torch_framework_ready": available,
        "model_object_loaded": available,
    }


@router.post("/pest-detection/predict")
def predict_pest(file: UploadFile = File(None)) -> Dict[str, Any]:
    """Run inference test on Pest Detection Engine (#31). Returns 503 if model is unconfigured."""
    # Enforce AI feature entitlement
    LicensePolicyService.get_instance().ensure_feature(LicenseFeature.AI)

    provider = get_ai_provider()
    if not provider.is_available():
        raise HTTPException(
            status_code=503,
            detail="AI inference model is not configured.",
        )

    if file:
        allowed_exts = {".jpg", ".jpeg", ".png", ".webp"}
        ext = Path(file.filename or "").suffix.lower()
        if ext not in allowed_exts:
            raise HTTPException(
                status_code=400,
                detail="Invalid image format. Allowed formats: .jpg, .jpeg, .png, .webp",
            )

        with tempfile.NamedTemporaryFile(delete=False, suffix=ext) as tmp:
            shutil.copyfileobj(file.file, tmp)
            tmp_path = Path(tmp.name)

        try:
            res = provider.predict(tmp_path)
        except ModelUnavailableError as e:
            raise HTTPException(status_code=503, detail=str(e))
        finally:
            if tmp_path.exists():
                tmp_path.unlink()
    else:
        try:
            res = provider.predict(Path("ai_models/sample.jpg"))
        except ModelUnavailableError as e:
            raise HTTPException(status_code=503, detail=str(e))
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))

    return {
        "status": "SUCCESS",
        "label": res.label,
        "confidence": res.confidence,
        "model_name": res.model_name,
        "model_version": res.model_version,
        "predictions": res.detections,
        "metadata": res.metadata,
    }
