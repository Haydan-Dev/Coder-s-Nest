from pydantic import BaseModel
from typing import List, Dict, Any
from app.schemas.folder import FolderResponse

class WorkspaceResponse(BaseModel):
    workspace_id: int
    project_id: int
    workspace_name: str
    is_default: bool
    folders: List[FolderResponse] = []
    permissions: Dict[str, Any] = {}
    
    class Config:
        from_attributes = True
