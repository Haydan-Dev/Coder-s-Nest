from pydantic import BaseModel, field_validator
from typing import Optional

class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    bio: Optional[str] = None
    phone_number: Optional[str] = None

class UserResponse(BaseModel):
    user_id: int
    email: str
    full_name: str
    phone_number: str

    @field_validator('phone_number', mode='before')
    @classmethod
    def cast_phone_to_str(cls, v):
        return str(v) if v is not None else v

    bio: Optional[str] = None
    profile_pic_url: Optional[str] = None
    banner_url: Optional[str] = None
    two_factor_enabled: bool

    class Config:
        from_attributes = True
