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
    def sync_disk_to_workspace(workspace_id: int, db: Session):
        lock = get_workspace_lock(workspace_id)
        with lock:
            workspace = db.query(Workspace).filter(Workspace.workspace_id == workspace_id).first()
            if not workspace:
                return None
            
            base_path = os.path.join(HOST_WORKSPACES_DIR, f"workspace_{workspace_id}")
            if not os.path.exists(base_path):
                return
                
            from app.services.file_watcher_service import IDE_IGNORE
            
            # Map existing DB folders/files for quick lookup
            db_folders = {f.folder_name: f for f in db.query(Folder).filter(Folder.workspace_id == workspace_id, Folder.is_deleted == False).all()}
            db_files = {f.file_name: f for f in db.query(File).filter(File.workspace_id == workspace_id, File.is_deleted == False).all()}
            
            def resolve_folder_id(rel_path: str):
                root_folder = db.query(Folder).filter(
                    Folder.workspace_id == workspace_id, Folder.folder_name == 'root', Folder.parent_folder_id == None
                ).first()
                root_id = root_folder.folder_id if root_folder else None

                if rel_path == "." or rel_path == "":
                    return root_id
                parts = rel_path.split(os.sep)
                parent_id = root_id
                for part in parts:
                    folder = db.query(Folder).filter(
                        Folder.workspace_id == workspace_id, Folder.folder_name == part, Folder.parent_folder_id == parent_id, Folder.is_deleted == False
                    ).first()
                    if not folder:
                        folder = Folder(workspace_id=workspace_id, parent_folder_id=parent_id, folder_name=part, created_by_user_id=1)
                        db.add(folder)
                        db.commit()
                        db.refresh(folder)
                    parent_id = folder.folder_id
                return parent_id

            for root, dirs, files in os.walk(base_path):
                # Filter ignored dirs
                dirs[:] = [d for d in dirs if d not in IDE_IGNORE]
                
                rel_root = os.path.relpath(root, base_path)
                folder_id = resolve_folder_id(rel_root)
                
                for file_name in files:
                    if file_name in IDE_IGNORE:
                        continue
                        
                    file_path = os.path.join(root, file_name)
                    try:
                        with open(file_path, "r", encoding="utf-8") as f:
                            content = f.read()
                    except UnicodeDecodeError:
                        content = "" # Ignore binary for now
                        
                    db_file = db.query(File).filter(
                        File.workspace_id == workspace_id, File.folder_id == folder_id, File.file_name == file_name, File.is_deleted == False
                    ).first()
                    
                    if not db_file:
                        new_file = File(
                            workspace_id=workspace_id, folder_id=folder_id, file_name=file_name,
                            file_extension="." + file_name.split('.')[-1] if '.' in file_name else "",
                            mime_type="text/plain",
                            file_content=content, file_size=len(content.encode('utf-8')), created_by_user_id=1
                        )
                        db.add(new_file)
                    elif db_file.file_content != content:
                        db_file.file_content = content
                        db_file.file_size = len(content.encode('utf-8'))
            
            db.commit()

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
