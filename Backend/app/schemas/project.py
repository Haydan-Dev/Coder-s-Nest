from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class ProjectCreate(BaseModel):
    name: str
    desc: str
    lang: str
    color: str
    access: str
    status: str

class JoinCodeRequest(BaseModel):
    code: str

class InviteRequest(BaseModel):
    email: str

class ProjectUpdate(BaseModel):
    name: Optional[str] = None
    desc: Optional[str] = None
    lang: Optional[str] = None
    color: Optional[str] = None
    access: Optional[str] = None
    status: Optional[str] = None

class ProjectResponse(BaseModel):
    id: int
    name: str
    desc: str
    lang: str
    color: str
    status: str
    access: str
    collaborators: List[str]
    updated: str
    
    class Config:
        from_attributes = True
