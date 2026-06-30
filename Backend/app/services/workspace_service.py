from sqlalchemy.orm import Session
from fastapi import HTTPException
from app.models.workspace import Workspace
from app.models.folder import Folder

class WorkspaceService:
    @staticmethod
    def get_workspace_structure(workspace_id: int, user_id: int, db: Session):
        workspace = db.query(Workspace).filter(Workspace.workspace_id == workspace_id).first()
        if not workspace:
            raise HTTPException(status_code=404, detail="Workspace not found")
            
        root_folders = db.query(Folder).filter(
            Folder.workspace_id == workspace_id, 
            Folder.parent_folder_id == None
        ).all()
        
        return {
            "workspace_id": workspace.workspace_id,
            "project_id": workspace.project_id,
            "workspace_name": workspace.workspace_name,
            "is_default": workspace.is_default,
            "folders": root_folders
        }
