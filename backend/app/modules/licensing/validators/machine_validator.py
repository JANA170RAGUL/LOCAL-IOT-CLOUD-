import logging
from app.modules.licensing.services.fingerprint_service import generate_fingerprint

logger = logging.getLogger(__name__)

def validate_machine(expected_hash: str) -> bool:
    """
    Validates if the current machine fingerprint matches the expected hash.
    In the future, tolerance logic can be added here (e.g. 1 out of 5 parts changed is OK).
    """
    current_fingerprint = generate_fingerprint()
    current_hash = current_fingerprint["fingerprint_hash"]
    
    if current_hash == expected_hash:
        return True
        
    logger.warning(f"Machine fingerprint mismatch! Expected: {expected_hash}, Got: {current_hash}")
    # Here you could log exactly which parts changed by comparing expected raw attributes with current_fingerprint
    return False
