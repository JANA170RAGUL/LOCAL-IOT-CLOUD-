import time
from app.modules.licensing.services.feature_service import feature_service

def check_telemetry_limits(redis_client) -> bool:
    """
    Checks rate limits and storage limits for telemetry ingestion.
    Returns True if allowed, False if blocked.
    """
    if not feature_service.has_valid_license():
        return False
        
    rate_limit = feature_service.get_feature_limit("telemetry_rate")
    storage_limit_gb = feature_service.get_feature_limit("storage")
    
    # 1. Rate Limiting (Sliding second window)
    if rate_limit is not None and rate_limit > 0:
        current_second = int(time.time())
        key = f"telemetry:rate:{current_second}"
        
        # Increment counter
        count = redis_client.incr(key)
        if count == 1:
            redis_client.expire(key, 2) # Expire in 2 seconds
            
        if count > rate_limit:
            return False
            
    # 2. Storage limit check (A background job would update this key based on InfluxDB size)
    if storage_limit_gb is not None and storage_limit_gb > 0:
        current_storage_raw = redis_client.get("telemetry:storage_gb")
        if current_storage_raw:
            try:
                current_storage_gb = float(current_storage_raw)
                if current_storage_gb >= storage_limit_gb:
                    return False
            except ValueError:
                pass
            
    return True
