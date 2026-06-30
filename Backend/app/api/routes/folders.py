from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database.deps import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.schemas.folder import FolderCreate, FolderResponse
from app.services.folder_service import FolderService

router = APIRouter(
    prefix="/folders",
    tags=["Folders"]
)

@router.post("/", response_model=FolderResponse)
def create_folder(data: FolderCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return FolderService.create_folder(current_user.user_id, data, db)
