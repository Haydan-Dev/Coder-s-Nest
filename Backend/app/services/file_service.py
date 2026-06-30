from sqlalchemy.orm import Session
from fastapi import HTTPException
from app.models.file import File
from app.models.folder import Folder
from app.models.workspace import Workspace
from app.schemas.file import FileCreate

class FileService:
    @staticmethod
    def create_file(user_id: int, data: FileCreate, db: Session):
        workspace = db.query(Workspace).filter(Workspace.workspace_id == data.workspace_id).first()
        if not workspace:
            raise HTTPException(status_code=404, detail="Workspace not found")

        folder = db.query(Folder).filter(Folder.folder_id == data.folder_id, Folder.workspace_id == data.workspace_id).first()
        if not folder:
            raise HTTPException(status_code=404, detail="Folder not found")

        # Calculate rough file size in bytes
        file_size_bytes = len(data.file_content.encode('utf-8'))

        new_file = File(
            workspace_id=data.workspace_id,
            folder_id=data.folder_id,
            file_name=data.file_name,
            file_extension=data.file_extension,
            mime_type=data.mime_type,
            file_content=data.file_content,
            file_size=file_size_bytes,
            created_by_user_id=user_id
        )
        db.add(new_file)
        db.commit()
        db.refresh(new_file)
        return new_file
