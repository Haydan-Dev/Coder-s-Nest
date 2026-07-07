from sqlalchemy.orm import Session
from fastapi import HTTPException
from app.models.file import File
from app.models.folder import Folder
from app.models.workspace import Workspace
from app.schemas.file import FileCreate, FileUpdate

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

    @staticmethod
    def delete_file(file_id: int, user_id: int, db: Session):
        from datetime import datetime
        file = db.query(File).filter(File.file_id == file_id).first()
        if not file:
            raise HTTPException(status_code=404, detail="File not found")
        file.is_deleted = True
        file.deleted_at = datetime.utcnow()
        db.commit()
        return {"detail": "File sent to recycle bin"}

    @staticmethod
    def update_file(file_id: int, user_id: int, data: FileUpdate, db: Session):
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
        return file

    @staticmethod
    def copy_file(file_id: int, user_id: int, db: Session, target_folder_id: int = None):
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
        return db.query(File).filter(File.created_by_user_id == user_id, File.is_deleted == True).all()

    @staticmethod
    def restore_file(file_id: int, user_id: int, db: Session):
        file = db.query(File).filter(File.file_id == file_id).first()
        if not file:
            raise HTTPException(status_code=404, detail="File not found")
        file.is_deleted = False
        file.deleted_at = None
        db.commit()
        db.refresh(file)
        return file

    @staticmethod
    def hard_delete_file(file_id: int, user_id: int, db: Session):
        file = db.query(File).filter(File.file_id == file_id).first()
        if not file:
            raise HTTPException(status_code=404, detail="File not found")
        db.delete(file)
        db.commit()
        return {"detail": "File permanently deleted"}
