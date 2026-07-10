import os
import time
import threading
from watchdog.observers import Observer
from watchdog.events import FileSystemEventHandler
from sqlalchemy.orm import Session
from app.database.db import SessionLocal
from app.models.file import File
from app.models.folder import Folder
from app.models.workspace import Workspace
from app.services.workspace_sync_service import HOST_WORKSPACES_DIR, get_workspace_lock
import hashlib

# Folders we strictly ignore from injecting into the DB to prevent DDOS
IDE_IGNORE = {".git", "node_modules", "__pycache__", "venv", ".env", ".pytest_cache"}

# Store active observers keyed by workspace_id
_active_watchers = {}

class ReverseSyncHandler(FileSystemEventHandler):
    def __init__(self, workspace_id: int):
        super().__init__()
        self.workspace_id = workspace_id
        self.base_path = os.path.join(HOST_WORKSPACES_DIR, f"workspace_{workspace_id}")

    def _should_ignore(self, path: str) -> bool:
        parts = path.split(os.sep)
        for ignored in IDE_IGNORE:
            if ignored in parts:
                return True
        return False

    def _get_relative_path(self, absolute_path: str) -> str:
        try:
            return os.path.relpath(absolute_path, self.base_path)
        except ValueError:
            return ""

    def _resolve_folder_id(self, relative_path: str, db: Session) -> int:
        if relative_path == "." or relative_path == "":
            return None
            
        parts = relative_path.split(os.sep)
        parent_id = None
        
        for part in parts:
            folder = db.query(Folder).filter(
                Folder.workspace_id == self.workspace_id,
                Folder.folder_name == part,
                Folder.parent_folder_id == parent_id,
                Folder.is_deleted == False
            ).first()
            
            if not folder:
                new_folder = Folder(
                    workspace_id=self.workspace_id,
                    parent_folder_id=parent_id,
                    folder_name=part,
                    created_by_user_id=1 # System user fallback
                )
                db.add(new_folder)
                db.commit()
                db.refresh(new_folder)
                parent_id = new_folder.folder_id
            else:
                parent_id = folder.folder_id
                
        return parent_id

    def on_created(self, event):
        if event.is_directory or self._should_ignore(event.src_path):
            return
            
        # Give file system time to write contents
        time.sleep(0.1)
            
        db = SessionLocal()
        try:
            lock = get_workspace_lock(self.workspace_id)
            with lock:
                rel_path = self._get_relative_path(event.src_path)
                folder_path, file_name = os.path.split(rel_path)
                
                folder_id = self._resolve_folder_id(folder_path, db) if folder_path else None
                
                existing_file = db.query(File).filter(
                    File.workspace_id == self.workspace_id,
                    File.folder_id == folder_id,
                    File.file_name == file_name,
                    File.is_deleted == False
                ).first()
                
                if not existing_file:
                    try:
                        with open(event.src_path, 'r', encoding='utf-8') as f:
                            content = f.read()
                    except UnicodeDecodeError:
                        content = "" # Ignore binary files for now
                        
                    new_file = File(
                        workspace_id=self.workspace_id,
                        folder_id=folder_id,
                        file_name=file_name,
                        file_extension="." + file_name.split('.')[-1] if '.' in file_name else "",
                        file_content=content,
                        file_size=len(content.encode('utf-8')),
                        created_by_user_id=1
                    )
                    db.add(new_file)
                    db.commit()
                    from app.services.terminal_service import TerminalService
                    TerminalService.broadcast_sync_event(self.workspace_id)
        finally:
            db.close()

    def on_modified(self, event):
        if event.is_directory or self._should_ignore(event.src_path):
            return
            
        time.sleep(0.1)
        db = SessionLocal()
        try:
            lock = get_workspace_lock(self.workspace_id)
            with lock:
                rel_path = self._get_relative_path(event.src_path)
                folder_path, file_name = os.path.split(rel_path)
                folder_id = self._resolve_folder_id(folder_path, db) if folder_path else None
                
                file = db.query(File).filter(
                    File.workspace_id == self.workspace_id,
                    File.folder_id == folder_id,
                    File.file_name == file_name,
                    File.is_deleted == False
                ).first()
                
                if file:
                    try:
                        with open(event.src_path, 'r', encoding='utf-8') as f:
                            new_content = f.read()
                            
                        # Anti-Loop Mechanism: Only update DB if content actually differs
                        if file.file_content != new_content:
                            file.file_content = new_content
                            file.file_size = len(new_content.encode('utf-8'))
                            db.commit()
                            from app.services.terminal_service import TerminalService
                            TerminalService.broadcast_sync_event(self.workspace_id)
                    except UnicodeDecodeError:
                        pass
        finally:
            db.close()

class FileWatcherService:
    @staticmethod
    def start_watcher(workspace_id: int):
        if workspace_id in _active_watchers:
            return
            
        target_dir = os.path.join(HOST_WORKSPACES_DIR, f"workspace_{workspace_id}")
        if not os.path.exists(target_dir):
            os.makedirs(target_dir, exist_ok=True)
            
        event_handler = ReverseSyncHandler(workspace_id)
        observer = Observer()
        observer.schedule(event_handler, target_dir, recursive=True)
        observer.start()
        
        _active_watchers[workspace_id] = observer

    @staticmethod
    def stop_watcher(workspace_id: int):
        observer = _active_watchers.pop(workspace_id, None)
        if observer:
            observer.stop()
            observer.join()
