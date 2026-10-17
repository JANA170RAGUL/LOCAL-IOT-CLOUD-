from pydantic import BaseModel, EmailStr, Field, validator
from app.core.password import validate_password

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int = 900
    requires_password_change: bool = False

class RefreshRequest(BaseModel):
    refresh_token: str

class LogoutRequest(BaseModel):
    refresh_token: str

class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str = Field(..., min_length=8)

    @validator("new_password")
    def password_policy(cls, v):
        if not validate_password(v):
            raise ValueError("Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, and one number.")
        return v

class ForgotPasswordRequest(BaseModel):
    email: EmailStr

class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str = Field(..., min_length=8)

    @validator("new_password")
    def password_policy(cls, v):
        if not validate_password(v):
            raise ValueError("Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, and one number.")
        return v

class RequestVerificationRequest(BaseModel):
    email: EmailStr

class VerifyEmailRequest(BaseModel):
    token: str
