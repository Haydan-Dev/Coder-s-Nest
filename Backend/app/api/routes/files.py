from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database.deps import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.schemas.file import FileCreate, FileResponse, FileUpdate, FileContentResponse
from app.services.file_service import FileService

router = APIRouter(
    prefix="/files",
    tags=["Files"]
)

@router.post("/", response_model=FileResponse)
def create_file(data: FileCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return FileService.create_file(current_user.user_id, data, db)

@router.delete("/{file_id}")
def delete_file(file_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return FileService.delete_file(file_id, current_user.user_id, db)

@router.get("/{file_id}/content", response_model=FileContentResponse)
def get_file_content(file_id: int, db: Session = Depends(get_db)):
    return FileService.get_file_content(file_id, db)

@router.patch("/{file_id}", response_model=FileResponse)
def update_file(file_id: int, data: FileUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return FileService.update_file(file_id, current_user.user_id, data, db)

@router.post("/{file_id}/copy", response_model=FileResponse)
def copy_file(file_id: int, target_folder_id: int = None, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return FileService.copy_file(file_id, current_user.user_id, db, target_folder_id)

@router.get("/bin/deleted", response_model=list[FileResponse])
def get_deleted_files(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return FileService.get_deleted_files(current_user.user_id, db)

@router.put("/{file_id}/restore", response_model=FileResponse)
def restore_file(file_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return FileService.restore_file(file_id, current_user.user_id, db)

@router.delete("/{file_id}/hard")
def hard_delete_file(file_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return FileService.hard_delete_file(file_id, current_user.user_id, db)
