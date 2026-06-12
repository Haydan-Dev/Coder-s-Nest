from pydantic import BaseModel, EmailStr, Field
from typing import Optional

class SignupSchema(BaseModel):
    full_name: str = Field(..., min_length=3, max_length=100)
    email: EmailStr
    phone_number: str = Field(..., min_length=10, max_length=15)
    password: str = Field(..., min_length=8)
    termsAccepted: bool = Field(...)

class LoginSchema(BaseModel):
    email: EmailStr
    password: str

class VerifyOTPRequest(BaseModel):
    email: EmailStr
    otp_code: str = Field(..., min_length=6, max_length=6)

class ForgotPasswordRequest(BaseModel):
    email: EmailStr

class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str = Field(..., min_length=8)
    confirm_password: str = Field(..., min_length=8)
    

class TwoFactorRequest(BaseModel):
    email: EmailStr
    password: str

class VerifyTwoFactorRequest(BaseModel):
    email: EmailStr
    otp_code: str = Field(..., min_length=6, max_length=6)
    temp_token: Optional[str] = None

class SignupResponse(BaseModel):
    message: str
    user_id: int