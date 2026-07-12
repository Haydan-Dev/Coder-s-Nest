from pydantic import BaseModel
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
    bio: Optional[str] = None
    profile_pic_url: Optional[str] = None
    two_factor_enabled: bool

    class Config:
        from_attributes = True
