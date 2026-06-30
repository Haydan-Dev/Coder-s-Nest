from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class FileCreate(BaseModel):
    workspace_id: int
    folder_id: int
    file_name: str
    file_extension: str
    mime_type: str
    file_content: str

class FileResponse(BaseModel):
    file_id: int
    workspace_id: int
    folder_id: Optional[int]
    file_name: str
    file_extension: str
    mime_type: str
    file_size: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
