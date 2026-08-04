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
        
    return user

def get_project_member(project_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    member = db.query(ProjectMember).filter(
        ProjectMember.project_id == project_id,
        ProjectMember.user_id == current_user.user_id,
        ProjectMember.is_active == True
    ).first()
    if not member:
        raise HTTPException(status_code=403, detail="You are not a member of this project")
    return member

def get_workspace_member(workspace_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    workspace = db.query(Workspace).filter(Workspace.workspace_id == workspace_id).first()
    if not workspace:
        raise HTTPException(status_code=404, detail="Workspace not found")
    
    member = db.query(ProjectMember).filter(
        ProjectMember.project_id == workspace.project_id,
        ProjectMember.user_id == current_user.user_id,
        ProjectMember.is_active == True
    ).first()
    
    if not member:
        raise HTTPException(status_code=403, detail="You do not have access to this workspace")
    return member
