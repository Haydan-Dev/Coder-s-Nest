from pydantic import BaseModel
from typing import List
from app.schemas.folder import FolderResponse

class WorkspaceResponse(BaseModel):
    workspace_id: int
    project_id: int
    workspace_name: str
    is_default: bool
    folders: List[FolderResponse] = []
    
    class Config:
        from_attributes = True
