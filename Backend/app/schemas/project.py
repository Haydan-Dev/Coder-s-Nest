from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class ProjectCreate(BaseModel):
    name: str
    desc: str
    lang: str
    color: str
    is_active: bool = True
    user_id: Optional[int] = None
    access: str
    status: str

class JoinCodeRequest(BaseModel):
    code: str

class InviteRequest(BaseModel):
    email: str

class InviteResponse(BaseModel):
    id: int
    unread: bool
    type: str
    avatar: str
    gradient: str
    text: str
    time: str
    status: str

class ProjectUpdate(BaseModel):
    name: Optional[str] = None
    desc: Optional[str] = None
    lang: Optional[str] = None
    color: Optional[str] = None
    access: Optional[str] = None
    status: Optional[str] = None

class ProjectMemberResponse(BaseModel):
    name: str
    init: str
    role: str
    online: bool
    color: str
    is_active: bool = True
    user_id: int

class ProjectWorkspaceResponse(BaseModel):
    id: str
    name: str
    status: str
    members: int
    emoji: str

class ProjectResponse(BaseModel):
    id: int
    name: str
    desc: str
    lang: str
    color: str
    is_active: bool = True
    user_id: int
    status: str
    access: str
    updated: str
    members: List[ProjectMemberResponse]
    workspaces: List[ProjectWorkspaceResponse]
    my_permissions: dict = {}
    activity_logs: List[dict] = []
    
    class Config:
        from_attributes = True
