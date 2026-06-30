from sqlalchemy.orm import Session
from fastapi import HTTPException
from app.models.folder import Folder
from app.models.workspace import Workspace
from app.schemas.folder import FolderCreate

class FolderService:
    @staticmethod
    def create_folder(user_id: int, data: FolderCreate, db: Session):
        workspace = db.query(Workspace).filter(Workspace.workspace_id == data.workspace_id).first()
        if not workspace:
            raise HTTPException(status_code=404, detail="Workspace not found")

        if data.parent_folder_id:
            parent = db.query(Folder).filter(Folder.folder_id == data.parent_folder_id, Folder.workspace_id == data.workspace_id).first()
            if not parent:
                raise HTTPException(status_code=404, detail="Parent folder not found")

        new_folder = Folder(
            workspace_id=data.workspace_id,
            parent_folder_id=data.parent_folder_id,
            folder_name=data.folder_name,
            created_by_user_id=user_id
        )
        db.add(new_folder)
        db.commit()
        db.refresh(new_folder)
        return new_folder
