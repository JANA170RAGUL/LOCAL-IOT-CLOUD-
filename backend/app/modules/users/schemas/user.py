from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from datetime import datetime

class UserBase(BaseModel):
    first_name: str = Field(..., max_length=100)
    last_name: str = Field(..., max_length=100)
    email: EmailStr
    phone: Optional[str] = Field(None, max_length=50)
    role: str = Field("Viewer", max_length=50)
    organization_id: Optional[str] = None
    tenant_id: Optional[str] = None

class UserCreate(UserBase):
    password: str = Field(..., min_length=8)

class UserUpdate(BaseModel):
    first_name: Optional[str] = Field(None, max_length=100)
    last_name: Optional[str] = Field(None, max_length=100)
    phone: Optional[str] = Field(None, max_length=50)
    role: Optional[str] = Field(None, max_length=50)

class UserResponse(UserBase):
    id: str
    status: str
    is_active: bool
    is_verified: bool
    avatar_url: Optional[str] = None
    last_login: Optional[datetime] = None
    password_changed_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class UpdateEmailRequest(BaseModel):
    new_email: EmailStr

class UpdatePhoneRequest(BaseModel):
    new_phone: str

class UpdateAvatarRequest(BaseModel):
    avatar_url: str

    class Config:
        from_attributes = True

class UserFilter(BaseModel):
    search: Optional[str] = None
    role: Optional[str] = None
    status: Optional[str] = None
    page: int = 1
    page_size: int = 20

class UserListResponse(BaseModel):
    items: list[UserResponse]
    total: int
    page: int
    page_size: int
    total_pages: int

class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str = Field(..., min_length=8)
    confirm_password: str

class ResetPasswordRequest(BaseModel):
    auto_generate: bool = True
    new_password: Optional[str] = Field(None, min_length=8)
    confirm_password: Optional[str] = None
