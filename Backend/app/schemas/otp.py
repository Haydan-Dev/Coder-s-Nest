from pydantic import BaseModel, EmailStr, Field


class OTPGenerateResponse(BaseModel):
    message: str
    email: EmailStr
    expires_in: int


class OTPVerifyRequest(BaseModel):
    email: EmailStr
    otp_code: str = Field(..., min_length=6, max_length=6)


class OTPVerifyResponse(BaseModel):
    message: str
    success: bool


class OTPResendRequest(BaseModel):
    email: EmailStr