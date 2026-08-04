from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime, timezone, timedelta

from app.database.session import get_db
from app.core.auth import get_current_user, require_permission
from app.modules.users.models.user import User
from app.modules.auth.models.api_key import ApiKey
from app.modules.auth.schemas.api_key import ApiKeyCreate, ApiKeyResponse, ApiKeyCreateResponse
from app.core.security import generate_api_key
from app.core.password import hash_password

router = APIRouter(prefix="/api-keys", tags=["API Keys"])

@router.post("/", response_model=ApiKeyCreateResponse, summary="Create an API Key")
def create_api_key(
    payload: ApiKeyCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("organization:update"))
):
    # Only Org Admins or Super Admins can create API keys for their organization/tenant
    # For simplicity, we assume the user's tenant_id is the scope
    
    if not current_user.tenant_id:
        raise HTTPException(status_code=400, detail="User must belong to a tenant to create API keys")
        
    # We need organization_id. Let's fetch the tenant to get the organization_id.
    from app.modules.tenants.models.tenant import Tenant
    tenant = db.query(Tenant).filter(Tenant.id == current_user.tenant_id).first()
    if not tenant:
        raise HTTPException(status_code=400, detail="Invalid tenant")
        
    raw_key = generate_api_key(prefix="lic")
    key_hash = hash_password(raw_key) # reusing password hasher for simplicity, or could use plain SHA256
    
    expires_at = None
    if payload.expires_in_days:
        expires_at = datetime.now(timezone.utc) + timedelta(days=payload.expires_in_days)
        
    api_key_record = ApiKey(
        organization_id=tenant.organization_id,
        tenant_id=current_user.tenant_id,
        name=payload.name,
        key_hash=key_hash,
        prefix=raw_key[:10], # lic_xxxxxx
        scopes=payload.scopes,
        expires_at=expires_at
    )
    db.add(api_key_record)
    db.commit()
    db.refresh(api_key_record)
    
    response = ApiKeyCreateResponse.from_orm(api_key_record)
    response.key = raw_key
    return response

@router.get("/", response_model=List[ApiKeyResponse], summary="List API Keys")
def list_api_keys(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("organization:read"))
):
    keys = db.query(ApiKey).filter(ApiKey.tenant_id == current_user.tenant_id, ApiKey.is_active == True).all()
    return keys

@router.delete("/{key_id}", summary="Revoke API Key")
def revoke_api_key(
    key_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("organization:update"))
):
    key = db.query(ApiKey).filter(ApiKey.id == key_id, ApiKey.tenant_id == current_user.tenant_id).first()
    if not key:
        raise HTTPException(status_code=404, detail="API Key not found")
        
    key.is_active = False
    db.commit()
    return {"message": "API Key revoked successfully"}
