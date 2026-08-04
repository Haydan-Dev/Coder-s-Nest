from sqlalchemy.orm import Session
from fastapi import HTTPException
from app.models.folder import Folder
from app.models.workspace import Workspace
from app.schemas.folder import FolderCreate, FolderUpdate
from app.services.permission_service import PermissionService

class FolderService:
    @staticmethod
    def create_folder(user_id: int, data: FolderCreate, db: Session):
        member = PermissionService.get_member_by_workspace(data.workspace_id, user_id, db)
        PermissionService.enforce_permission(member, 'can_edit_files')
        
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

    @staticmethod
    def delete_folder(folder_id: int, user_id: int, db: Session):
        member = PermissionService.get_member_by_folder(folder_id, user_id, db)
        PermissionService.enforce_permission(member, 'can_delete_files')
        
        from datetime import datetime
        import os
        import shutil
        from app.services.workspace_sync_service import WorkspaceSyncService
        
        folder = db.query(Folder).filter(Folder.folder_id == folder_id).first()
        if not folder:
            raise HTTPException(status_code=404, detail="Folder not found")
        if folder.folder_name == "root" and folder.parent_folder_id is None:
            raise HTTPException(status_code=400, detail="Cannot delete root folder")
        
        now = datetime.utcnow()
        
        try:
            folder_path = WorkspaceSyncService._get_folder_path(folder_id, db, folder.workspace_id)
        except Exception:
            folder_path = None
            
        def soft_delete_recursive(f):
            f.is_deleted = True
            f.deleted_at = now
            for sub_f in f.subfolders:
                soft_delete_recursive(sub_f)
            for child_file in f.files:
                child_file.is_deleted = True
                child_file.deleted_at = now
                
        soft_delete_recursive(folder)
        db.commit()
        
        if folder_path and os.path.exists(folder_path):
            try:
                shutil.rmtree(folder_path)
            except Exception as e:
                print(f"Failed to delete physical folder {folder.folder_name}: {e}")
                
        return {"detail": "Folder and its contents sent to recycle bin"}

    @staticmethod
    def update_folder(folder_id: int, user_id: int, data: FolderUpdate, db: Session):
        member = PermissionService.get_member_by_folder(folder_id, user_id, db)
        if data.folder_name is not None:
            PermissionService.enforce_permission(member, 'can_rename_files')
        if data.parent_folder_id is not None:
            PermissionService.enforce_permission(member, 'can_edit_files')
            
        folder = db.query(Folder).filter(Folder.folder_id == folder_id).first()
        if not folder:
            raise HTTPException(status_code=404, detail="Folder not found")
        if folder.folder_name == "root" and folder.parent_folder_id is None:
            raise HTTPException(status_code=400, detail="Cannot modify root folder")
        
        if data.folder_name is not None:
            folder.folder_name = data.folder_name
            
        if data.parent_folder_id is not None:
            parent = db.query(Folder).filter(Folder.folder_id == data.parent_folder_id, Folder.workspace_id == folder.workspace_id).first()
            if not parent:
                raise HTTPException(status_code=404, detail="Parent folder not found")
            folder.parent_folder_id = data.parent_folder_id
            
        db.commit()
        db.refresh(folder)
        return folder

    @staticmethod
    def copy_folder(folder_id: int, user_id: int, db: Session, target_folder_id: int = None):
        member = PermissionService.get_member_by_folder(folder_id, user_id, db)
        PermissionService.enforce_permission(member, 'can_edit_files')
        
        original_folder = db.query(Folder).filter(Folder.folder_id == folder_id).first()
        if not original_folder:
            raise HTTPException(status_code=404, detail="Folder not found")
        if original_folder.folder_name == "root" and original_folder.parent_folder_id is None:
            raise HTTPException(status_code=400, detail="Cannot copy root folder")
            
        def duplicate_folder(src_folder, new_parent_id, is_top_level=False):
            new_name = src_folder.folder_name
            if is_top_level:
                new_name = f"{new_name} - Copy"
                
            new_folder = Folder(
                workspace_id=src_folder.workspace_id,
                parent_folder_id=new_parent_id,
                folder_name=new_name,
                created_by_user_id=user_id
            )
            db.add(new_folder)
            db.flush()
            
            from app.models.file import File
            src_files = db.query(File).filter(File.folder_id == src_folder.folder_id).all()
            for f in src_files:
                new_file = File(
                    workspace_id=f.workspace_id,
                    folder_id=new_folder.folder_id,
                    file_name=f.file_name,
                    file_extension=f.file_extension,
                    mime_type=f.mime_type,
                    file_content=f.file_content,
                    file_size=f.file_size,
                    created_by_user_id=user_id
                )
                db.add(new_file)
                
            src_subfolders = db.query(Folder).filter(Folder.parent_folder_id == src_folder.folder_id).all()
            for sf in src_subfolders:
                duplicate_folder(sf, new_folder.folder_id)
                
            return new_folder
            
        new_top_folder = duplicate_folder(original_folder, target_folder_id if target_folder_id is not None else original_folder.parent_folder_id, True)
        db.commit()
        db.refresh(new_top_folder)
        return new_top_folder

    @staticmethod
    def get_deleted_folders(user_id: int, db: Session):
        from app.models.workspace import Workspace
        from app.models.project import Project
        return db.query(Folder).join(Workspace, Folder.workspace_id == Workspace.workspace_id)\
            .join(Project, Workspace.project_id == Project.project_id)\
            .filter(
                Project.created_by_user_id == user_id, 
                Folder.is_deleted == True
            ).all()

    @staticmethod
    def restore_folder(folder_id: int, user_id: int, db: Session):
        member = PermissionService.get_member_by_folder(folder_id, user_id, db)
        PermissionService.enforce_permission(member, 'can_delete_files')
        
        folder = db.query(Folder).filter(Folder.folder_id == folder_id).first()
        if not folder:
            raise HTTPException(status_code=404, detail="Folder not found")
            
        def restore_recursive(f):
            f.is_deleted = False
            f.deleted_at = None
            for sub_f in f.subfolders:
                restore_recursive(sub_f)
            for child_file in f.files:
                child_file.is_deleted = False
                child_file.deleted_at = None
                
        restore_recursive(folder)
        
        # Auto-restore parent folders to ensure it appears in the tree
        current_parent_id = folder.parent_folder_id
        while current_parent_id:
            parent = db.query(Folder).filter(Folder.folder_id == current_parent_id).first()
            if not parent:
                break
            if parent.is_deleted:
                parent.is_deleted = False
                parent.deleted_at = None
            current_parent_id = parent.parent_folder_id
            
        db.commit()
        db.refresh(folder)
        
        try:
            from app.services.workspace_sync_service import WorkspaceSyncService
            WorkspaceSyncService.sync_workspace_to_disk(folder.workspace_id, db)
        except Exception as e:
            print(f"Sync error on restore folder: {e}")
            
        return folder

    @staticmethod
    def hard_delete_folder(folder_id: int, user_id: int, db: Session):
        member = PermissionService.get_member_by_folder(folder_id, user_id, db)
        PermissionService.enforce_permission(member, 'can_delete_files')
        
        folder = db.query(Folder).filter(Folder.folder_id == folder_id).first()
        if not folder:
            raise HTTPException(status_code=404, detail="Folder not found")
            
        def delete_recursive(f):
            # delete children first
            subfolders = db.query(Folder).filter(Folder.parent_folder_id == f.folder_id).all()
            for sub_f in subfolders:
                delete_recursive(sub_f)
            
            # delete files
            from app.models.file import File
            db.query(File).filter(File.folder_id == f.folder_id).delete()
            
            # then delete self
            db.delete(f)
            
        delete_recursive(folder)
        db.commit()
        return {"detail": "Folder permanently deleted"}
