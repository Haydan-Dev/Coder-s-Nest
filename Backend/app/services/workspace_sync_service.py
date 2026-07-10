import os
import threading
from sqlalchemy.orm import Session
from app.models.file import File
from app.models.folder import Folder
from app.models.workspace import Workspace

# Move host_workspaces OUTSIDE of the backend folder to prevent uvicorn auto-reload loops.
PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
HOST_WORKSPACES_DIR = os.path.join(PROJECT_ROOT, "host_workspaces")

# Ensure the directory exists
os.makedirs(HOST_WORKSPACES_DIR, exist_ok=True)

_workspace_locks = {}

def get_workspace_lock(workspace_id: int):
    if workspace_id not in _workspace_locks:
        _workspace_locks[workspace_id] = threading.Lock()
    return _workspace_locks[workspace_id]

class WorkspaceSyncService:
    @staticmethod
    def _get_folder_path(folder_id: int, db: Session, workspace_id: int):
        path_parts = []
        current_folder_id = folder_id
        visited = set()
        while current_folder_id:
            if current_folder_id in visited:
                print(f"Cycle detected for folder_id {current_folder_id}")
                break
            visited.add(current_folder_id)
            folder = db.query(Folder).filter(Folder.folder_id == current_folder_id).first()
            if not folder:
                break
            if folder.parent_folder_id is not None:
                path_parts.insert(0, folder.folder_name)
            current_folder_id = folder.parent_folder_id
            
        base_path = os.path.join(HOST_WORKSPACES_DIR, f"workspace_{workspace_id}")
        if path_parts:
            return os.path.join(base_path, *path_parts)
        return base_path

    @staticmethod
    def sync_workspace_to_disk(workspace_id: int, db: Session):
        lock = get_workspace_lock(workspace_id)
        with lock:
            workspace = db.query(Workspace).filter(Workspace.workspace_id == workspace_id).first()
            if not workspace:
                return None
                
            base_path = os.path.join(HOST_WORKSPACES_DIR, f"workspace_{workspace_id}")
            os.makedirs(base_path, exist_ok=True)
            
            folders = db.query(Folder).filter(Folder.workspace_id == workspace_id, Folder.is_deleted == False).all()
            for folder in folders:
                folder_path = WorkspaceSyncService._get_folder_path(folder.folder_id, db, workspace_id)
                os.makedirs(folder_path, exist_ok=True)
                
            files = db.query(File).filter(File.workspace_id == workspace_id, File.is_deleted == False).all()
            for file in files:
                if file.folder_id:
                    folder_path = WorkspaceSyncService._get_folder_path(file.folder_id, db, workspace_id)
                    file_path = os.path.join(folder_path, file.file_name)
                else:
                    file_path = os.path.join(base_path, file.file_name)
                    
                with open(file_path, "w", encoding="utf-8") as f:
                    f.write(file.file_content or "")
                    
            return base_path

    @staticmethod
    def sync_single_file_to_disk(file_id: int, db: Session):
        file = db.query(File).filter(File.file_id == file_id).first()
        if not file or file.is_deleted:
            return
            
        lock = get_workspace_lock(file.workspace_id)
        with lock:
            if file.folder_id:
                folder_path = WorkspaceSyncService._get_folder_path(file.folder_id, db, file.workspace_id)
                file_path = os.path.join(folder_path, file.file_name)
            else:
                base_path = os.path.join(HOST_WORKSPACES_DIR, f"workspace_{file.workspace_id}")
                file_path = os.path.join(base_path, file.file_name)
                
            os.makedirs(os.path.dirname(file_path), exist_ok=True)
            with open(file_path, "w", encoding="utf-8") as f:
                f.write(file.file_content or "")
