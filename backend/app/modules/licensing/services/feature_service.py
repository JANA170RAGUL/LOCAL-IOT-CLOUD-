from typing import Dict, Any, Optional

class FeatureService:
    """
    In-memory registry of loaded license features.
    Populated at startup by the LicenseValidator.
    """
    _instance = None
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(FeatureService, cls).__new__(cls)
            cls._instance.features = {}
            cls._instance.is_licensed = False
        return cls._instance

    def load_features(self, features_dict: Dict[str, Any]):
        """Load features from the active license"""
        self.features = features_dict
        self.is_licensed = True
        
    def clear_features(self):
        """Clear features (e.g. if license becomes invalid)"""
        self.features = {}
        self.is_licensed = False

    def get_feature_limit(self, feature_key: str) -> Optional[int]:
        """Returns the numeric limit for a feature, or None if unlimited/not found."""
        val = self.features.get(feature_key)
        if isinstance(val, int):
            return val
        return None

    def is_feature_enabled(self, feature_key: str) -> bool:
        """Returns True if a boolean feature is enabled."""
        val = self.features.get(feature_key)
        if isinstance(val, bool):
            return val
        # If it's an int > 0, it technically is enabled
        if isinstance(val, int) and val > 0:
            return True
        return False
        
    def has_valid_license(self) -> bool:
        return self.is_licensed

feature_service = FeatureService()
