from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, JWTError
from sqlalchemy.orm import Session

from app.database.deps import get_db
from app.models.user import User
from app.models.workspace import Workspace
from app.models.project_member import ProjectMember, ProjectMemberRole
from app.core.config import SECRET_KEY, ALGORITHM

security = HTTPBearer()

def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security), db: Session = Depends(get_db)):
    token = credentials.credentials
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise credentials_exception
        user_id = int(user_id)
    except JWTError:
        raise credentials_exception
        
    user = db.query(User).filter(User.user_id == user_id).first()
    if user is None:
        raise credentials_exception
        
    if user.is_deleted:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Your account has been blocked or deleted."
        )
        
    # Check if user has active sessions (Enforces Force Logout)
    from app.models.user_session import UserSession
    active_sessions = db.query(UserSession).filter(
        UserSession.user_id == user_id, 
        UserSession.is_active == True
    ).count()
    
    if active_sessions == 0:
        raise credentials_exception
        
    return user

def get_project_member(project_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    from app.models.project import Project
    project = db.query(Project).filter(Project.project_id == project_id).first()
    
    if not project or project.is_deleted:
        raise HTTPException(status_code=404, detail="Project not found or has been deleted.")
        
    if project.status == "Frozen":
        raise HTTPException(status_code=403, detail="This project has been frozen by the administrator.")
        
    member = db.query(ProjectMember).filter(
        ProjectMember.project_id == project_id,
        ProjectMember.user_id == current_user.user_id,
        ProjectMember.is_active == True
    ).first()
    if not member:
        raise HTTPException(status_code=403, detail="You are not a member of this project")
    return member

def get_workspace_member(workspace_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    from app.models.project import Project
    workspace = db.query(Workspace).filter(Workspace.workspace_id == workspace_id).first()
    if not workspace:
        raise HTTPException(status_code=404, detail="Workspace not found")
        
    project = db.query(Project).filter(Project.project_id == workspace.project_id).first()
    if not project or project.is_deleted:
        raise HTTPException(status_code=404, detail="Associated project not found or has been deleted.")
        
    if project.status == "Frozen":
        raise HTTPException(status_code=403, detail="The associated project has been frozen by the administrator.")
    
    member = db.query(ProjectMember).filter(
        ProjectMember.project_id == workspace.project_id,
        ProjectMember.user_id == current_user.user_id,
        ProjectMember.is_active == True
    ).first()
    
    if not member:
        raise HTTPException(status_code=403, detail="You do not have access to this workspace")
    return member
