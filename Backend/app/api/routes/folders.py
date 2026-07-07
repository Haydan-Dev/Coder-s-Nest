from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database.deps import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.schemas.folder import FolderCreate, FolderResponse, FolderUpdate
from app.services.folder_service import FolderService

router = APIRouter(
    prefix="/folders",
    tags=["Folders"]
)

@router.post("/", response_model=FolderResponse)
def create_folder(data: FolderCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return FolderService.create_folder(current_user.user_id, data, db)

@router.delete("/{folder_id}")
def delete_folder(folder_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return FolderService.delete_folder(folder_id, current_user.user_id, db)

@router.patch("/{folder_id}", response_model=FolderResponse)
def update_folder(folder_id: int, data: FolderUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return FolderService.update_folder(folder_id, current_user.user_id, data, db)

@router.post("/{folder_id}/copy", response_model=FolderResponse)
def copy_folder(folder_id: int, target_folder_id: int = None, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return FolderService.copy_folder(folder_id, current_user.user_id, db, target_folder_id)

@router.get("/bin/deleted", response_model=list[FolderResponse])
def get_deleted_folders(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return FolderService.get_deleted_folders(current_user.user_id, db)

@router.put("/{folder_id}/restore", response_model=FolderResponse)
def restore_folder(folder_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return FolderService.restore_folder(folder_id, current_user.user_id, db)

@router.delete("/{folder_id}/hard")
def hard_delete_folder(folder_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return FolderService.hard_delete_folder(folder_id, current_user.user_id, db)
