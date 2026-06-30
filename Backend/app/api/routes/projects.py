from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List

from app.database.deps import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.schemas.project import ProjectCreate, ProjectUpdate, ProjectResponse, JoinCodeRequest, InviteRequest
from app.services.project_service import ProjectService

router = APIRouter(
    prefix="/projects",
    tags=["Projects"]
)

@router.get("/", response_model=List[ProjectResponse])
def get_projects(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return ProjectService.get_projects_for_user(current_user.user_id, db)

@router.post("/", response_model=ProjectResponse)
def create_project(data: ProjectCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return ProjectService.create_project(current_user.user_id, data, db)

@router.put("/{project_id}", response_model=ProjectResponse)
def update_project(project_id: int, data: ProjectUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return ProjectService.update_project(project_id, current_user.user_id, data, db)

@router.delete("/{project_id}")
def delete_project(project_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return ProjectService.delete_project(project_id, current_user.user_id, db)

@router.get("/bin/", response_model=List[ProjectResponse])
def get_deleted_projects(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return ProjectService.get_deleted_projects(current_user.user_id, db)

@router.put("/{project_id}/restore", response_model=ProjectResponse)
def restore_project(project_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return ProjectService.restore_project(project_id, current_user.user_id, db)

@router.delete("/{project_id}/hard")
def hard_delete_project(project_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return ProjectService.hard_delete_project(project_id, current_user.user_id, db)

@router.post("/{project_id}/generate-code")
def generate_invite_code(project_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return ProjectService.generate_invite_code(project_id, current_user.user_id, db)

@router.post("/join-by-code")
def join_by_code(data: JoinCodeRequest, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return ProjectService.join_by_code(data.code, current_user.user_id, db)

@router.post("/{project_id}/invite")
def invite_user_by_email(project_id: int, data: InviteRequest, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return ProjectService.invite_user_by_email(project_id, current_user.user_id, data.email, db)
