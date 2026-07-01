from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database.deps import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.schemas.file import FileCreate, FileResponse
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
