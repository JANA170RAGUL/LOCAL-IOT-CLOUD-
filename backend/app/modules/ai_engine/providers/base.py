"""
app/modules/ai_engine/providers/base.py

Abstract base class and output data structures for AI model providers in LocalIoTCloud.
"""

from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from pathlib import Path
from typing import Dict, Any, List


@dataclass(frozen=True)
class PredictionResult:
    label: str
    confidence: float
    model_name: str
    model_version: str
    metadata: Dict[str, Any] = field(default_factory=dict)
    detections: List[Dict[str, Any]] = field(default_factory=list)


class AIModelProvider(ABC):
    """Abstract interface for AI model inference providers."""

    @abstractmethod
    def is_available(self) -> bool:
        """Returns True if model weights are loaded and ready for inference."""
        raise NotImplementedError

    @abstractmethod
    def predict(self, image_path: Path) -> PredictionResult:
        """Executes inference on an image file and returns structured predictions."""
        raise NotImplementedError
