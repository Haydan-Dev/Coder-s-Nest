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
            Folder.parent_folder_id == None,
            Folder.is_deleted == False
        ).all()
        
        def filter_deleted(folder):
            return {
                "folder_id": folder.folder_id,
                "workspace_id": folder.workspace_id,
                "parent_folder_id": folder.parent_folder_id,
                "folder_name": folder.folder_name,
                "is_deleted": folder.is_deleted,
                "created_at": folder.created_at,
                "subfolders": [filter_deleted(sf) for sf in folder.subfolders if not sf.is_deleted],
                "files": [f for f in folder.files if not f.is_deleted]
            }
        
        return {
            "workspace_id": workspace.workspace_id,
            "project_id": workspace.project_id,
            "workspace_name": workspace.workspace_name,
            "is_default": workspace.is_default,
            "folders": [filter_deleted(f) for f in root_folders]
        }

    @staticmethod
    def get_workspace_by_project(project_id: int, user_id: int, db: Session):
        workspace = db.query(Workspace).filter(Workspace.project_id == project_id, Workspace.is_default == True).first()
        if not workspace:
            raise HTTPException(status_code=404, detail="Default workspace not found for this project")
            
        root_folders = db.query(Folder).filter(
            Folder.workspace_id == workspace.workspace_id, 
            Folder.parent_folder_id == None,
            Folder.is_deleted == False
        ).all()
        
        def filter_deleted(folder):
            return {
                "folder_id": folder.folder_id,
                "workspace_id": folder.workspace_id,
                "parent_folder_id": folder.parent_folder_id,
                "folder_name": folder.folder_name,
                "is_deleted": folder.is_deleted,
                "created_at": folder.created_at,
                "subfolders": [filter_deleted(sf) for sf in folder.subfolders if not sf.is_deleted],
                "files": [f for f in folder.files if not f.is_deleted]
            }
        
        return {
            "workspace_id": workspace.workspace_id,
            "project_id": workspace.project_id,
            "workspace_name": workspace.workspace_name,
            "is_default": workspace.is_default,
            "folders": [filter_deleted(f) for f in root_folders]
        }
