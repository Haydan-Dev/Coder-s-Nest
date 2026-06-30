from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from app.schemas.file import FileResponse

class FolderCreate(BaseModel):
    folder_name: str
    workspace_id: int
    parent_folder_id: Optional[int] = None

class FolderResponse(BaseModel):
    folder_id: int
    workspace_id: int
    parent_folder_id: Optional[int]
    folder_name: str
    created_at: datetime
    
    subfolders: List['FolderResponse'] = []
    files: List[FileResponse] = []

    class Config:
        from_attributes = True

FolderResponse.model_rebuild()
