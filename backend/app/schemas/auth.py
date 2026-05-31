from pydantic import BaseModel, EmailStr, Field


class RegisterRequest(BaseModel):
    name: str = Field(min_length=2, max_length=120)
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)


class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)


class AuthResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class TechnicalAccessVerifyRequest(BaseModel):
    pin: str = Field(min_length=4, max_length=6)


class TechnicalAccessStatusResponse(BaseModel):
    ok: bool
    is_blocked: bool
    blocked_seconds_left: int
    remaining_attempts: int
    message: str = ""
