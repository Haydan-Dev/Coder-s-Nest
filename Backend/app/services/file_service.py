from sqlalchemy.orm import Session
from fastapi import HTTPException
from app.models.file import File
from app.models.folder import Folder
from app.models.workspace import Workspace
from app.schemas.file import FileCreate, FileUpdate
from app.services.workspace_sync_service import WorkspaceSyncService
from app.services.permission_service import PermissionService

class FileService:
    @staticmethod
    def create_file(user_id: int, data: FileCreate, db: Session):
        member = PermissionService.get_member_by_workspace(data.workspace_id, user_id, db)
        PermissionService.enforce_permission(member, 'can_edit_files')
        
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
        
        try:
            WorkspaceSyncService.sync_single_file_to_disk(new_file.file_id, db)
        except Exception as e:
            print(f"Sync error on create: {e}")
            
        return new_file

    @staticmethod
    def delete_file(file_id: int, user_id: int, db: Session):
        member = PermissionService.get_member_by_file(file_id, user_id, db)
        PermissionService.enforce_permission(member, 'can_delete_files')
        
        from datetime import datetime
        import os
        from app.services.workspace_sync_service import WorkspaceSyncService
        
        file = db.query(File).filter(File.file_id == file_id).first()
        if not file:
            raise HTTPException(status_code=404, detail="File not found")
        file.is_deleted = True
        file.deleted_at = datetime.utcnow()
        db.commit()
        
        try:
            folder_path = WorkspaceSyncService._get_folder_path(file.folder_id, db, file.workspace_id)
            physical_path = os.path.join(folder_path, file.file_name)
            if os.path.exists(physical_path):
                os.remove(physical_path)
        except Exception as e:
            print(f"Failed to delete physical file {file.file_name}: {e}")
            
        return {"detail": "File sent to recycle bin"}

    @staticmethod
    def get_file_content(file_id: int, db: Session):
        file = db.query(File).filter(File.file_id == file_id).first()
        if not file:
            raise HTTPException(status_code=404, detail="File not found")
        return {"file_content": file.file_content}

    @staticmethod
    def update_file(file_id: int, user_id: int, data: FileUpdate, db: Session):
        member = PermissionService.get_member_by_file(file_id, user_id, db)
        
        # Determine permission based on what's being updated
        if data.file_name is not None:
            PermissionService.enforce_permission(member, 'can_rename_files')
        if data.file_content is not None or data.folder_id is not None:
            PermissionService.enforce_permission(member, 'can_edit_files')
            
        file = db.query(File).filter(File.file_id == file_id).first()
        if not file:
            raise HTTPException(status_code=404, detail="File not found")
        
        if data.file_name is not None:
            file.file_name = data.file_name
            if '.' in data.file_name:
                file.file_extension = '.' + data.file_name.split('.')[-1]
            else:
                file.file_extension = ''
        
        if data.folder_id is not None:
            folder = db.query(Folder).filter(Folder.folder_id == data.folder_id, Folder.workspace_id == file.workspace_id).first()
            if not folder:
                raise HTTPException(status_code=404, detail="Target folder not found")
            file.folder_id = data.folder_id

        if data.file_content is not None:
            file.file_content = data.file_content
            file.file_size = len(data.file_content.encode('utf-8'))
            
        file.last_edited_by_user_id = user_id
        db.commit()
        db.refresh(file)
        
        try:
            WorkspaceSyncService.sync_single_file_to_disk(file.file_id, db)
        except Exception as e:
            print(f"Sync error on update: {e}")
            
        return file

    @staticmethod
    def copy_file(file_id: int, user_id: int, db: Session, target_folder_id: int = None):
        member = PermissionService.get_member_by_file(file_id, user_id, db)
        PermissionService.enforce_permission(member, 'can_edit_files')
        
        file = db.query(File).filter(File.file_id == file_id).first()
        if not file:
            raise HTTPException(status_code=404, detail="File not found")
            
        base_name = file.file_name
        if file.file_extension and base_name.endswith(file.file_extension):
            base_name = base_name[:-len(file.file_extension)]
            
        new_name = f"{base_name} - Copy{file.file_extension}"
        
        new_file = File(
            workspace_id=file.workspace_id,
            folder_id=target_folder_id if target_folder_id is not None else file.folder_id,
            file_name=new_name,
            file_extension=file.file_extension,
            mime_type=file.mime_type,
            file_content=file.file_content,
            file_size=file.file_size,
            created_by_user_id=user_id
        )
        db.add(new_file)
        db.commit()
        db.refresh(new_file)
        return new_file

    @staticmethod
    def get_deleted_files(user_id: int, db: Session):
        from app.models.workspace import Workspace
        from app.models.project import Project
        return db.query(File).join(Workspace, File.workspace_id == Workspace.workspace_id)\
            .join(Project, Workspace.project_id == Project.project_id)\
            .filter(
                Project.created_by_user_id == user_id, 
                File.is_deleted == True
            ).all()

    @staticmethod
    def restore_file(file_id: int, user_id: int, db: Session):
        member = PermissionService.get_member_by_file(file_id, user_id, db)
        PermissionService.enforce_permission(member, 'can_delete_files')
        
        file = db.query(File).filter(File.file_id == file_id).first()
        if not file:
            raise HTTPException(status_code=404, detail="File not found")
            
        file.is_deleted = False
        file.deleted_at = None
        
        # Auto-restore parent folders to ensure it appears in the tree
        current_folder_id = file.folder_id
        while current_folder_id:
            parent_folder = db.query(Folder).filter(Folder.folder_id == current_folder_id).first()
            if not parent_folder:
                break
            if parent_folder.is_deleted:
                parent_folder.is_deleted = False
                parent_folder.deleted_at = None
            current_folder_id = parent_folder.parent_folder_id
            
        db.commit()
        db.refresh(file)
        
        try:
            from app.services.workspace_sync_service import WorkspaceSyncService
            WorkspaceSyncService.sync_single_file_to_disk(file.file_id, db)
        except Exception as e:
            print(f"Sync error on restore: {e}")
            
        return file

    @staticmethod
    def hard_delete_file(file_id: int, user_id: int, db: Session):
        member = PermissionService.get_member_by_file(file_id, user_id, db)
        PermissionService.enforce_permission(member, 'can_delete_files')
        
        file = db.query(File).filter(File.file_id == file_id).first()
        if not file:
            raise HTTPException(status_code=404, detail="File not found")
        db.delete(file)
        db.commit()
        return {"detail": "File permanently deleted"}
