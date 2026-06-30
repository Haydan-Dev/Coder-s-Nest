from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database.deps import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.schemas.workspace import WorkspaceResponse
from app.services.workspace_service import WorkspaceService

router = APIRouter(
    prefix="/workspaces",
    tags=["Workspaces"]
)

@router.get("/{workspace_id}", response_model=WorkspaceResponse)
def get_workspace(workspace_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return WorkspaceService.get_workspace_structure(workspace_id, current_user.user_id, db)
