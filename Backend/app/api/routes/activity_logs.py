from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Any
from app.database.deps import get_db
from app.api.deps import get_current_user
from app.schemas.user import UserResponse
from app.services.activity_log_service import get_project_activity_logs

router = APIRouter(
    prefix="/activity-logs",
    tags=["Activity Logs"]
)

@router.get("/project/{project_id}")
def get_project_logs(
    project_id: int,
    limit: int = 50,
    db: Session = Depends(get_db),
    current_user: UserResponse = Depends(get_current_user)
) -> Any:
    """
    Get activity logs for a specific project.
    Visibility depends on user permissions.
    """
    logs = get_project_activity_logs(
        db=db, 
        project_id=project_id, 
        current_user_id=current_user.user_id,
        limit=limit
    )
    
    # We should return serialized dicts or pydantic models. 
    # For now, let's map the SQLAlchemy objects to dictionaries for the response.
    # The frontend needs info about the user who did the action.
    
    response = []
    for log in logs:
        # Assuming there is a relationship `user` in ActivityLog, but we can just return the raw data and let UI fetch or we join it.
        # It's better to fetch the user details. Let's do a basic serialization.
        user_name = "Unknown"
        user_avatar = None
        # We can fetch user if needed, but standard is to return user_id
        
        response.append({
            "id": log.activity_log_id,
            "user_id": log.user_id,
            "action": log.action,
            "entity_type": log.entity_type,
            "entity_id": log.entity_id,
            "metadata": log.metadata_,
            "created_at": log.created_at.isoformat() if log.created_at else None
        })
        
    return {"data": response}

@router.get("/me")
def get_my_logs(
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: UserResponse = Depends(get_current_user)
) -> Any:
    """
    Get personal activity logs for the current user.
    """
    from app.services.activity_log_service import get_personal_activity_logs
    
    logs = get_personal_activity_logs(
        db=db, 
        current_user_id=current_user.user_id,
        limit=limit
    )
    
    response = []
    from app.models.user import User
    from app.models.project import Project
    
    for log in logs:
        meta = log.metadata_ or {}
        
        # Resolve target name if email is in metadata
        if "email" in meta:
            target_user = db.query(User).filter(User.email == meta["email"]).first()
            if target_user:
                meta["target_name"] = target_user.full_name
                
        # Resolve project name
        if log.project_id:
            proj = db.query(Project).filter(Project.project_id == log.project_id).first()
            if proj:
                meta["project_name"] = proj.project_name
                
        response.append({
            "id": log.activity_log_id,
            "project_id": log.project_id,
            "action": log.action,
            "entity_type": log.entity_type,
            "entity_id": log.entity_id,
            "metadata": meta,
            "created_at": log.created_at.isoformat() if log.created_at else None
        })
        
    return {"data": response}
