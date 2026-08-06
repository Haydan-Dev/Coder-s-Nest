from sqlalchemy.orm import Session
from app.models.activity_log import ActivityLog
from app.models.project_member import ProjectMember
from app.models.project import Project
from typing import List, Optional, Dict
from datetime import datetime

def log_activity(
    db: Session, 
    user_id: int, 
    action: str, 
    project_id: Optional[int] = None, 
    workspace_id: Optional[int] = None, 
    entity_type: Optional[str] = None,
    entity_id: Optional[str] = None,
    metadata_: Optional[Dict] = None,
    id_address: Optional[str] = None
):
    """
    Creates a new activity log entry.
    """
    new_log = ActivityLog(
        user_id=user_id,
        project_id=project_id,
        workspace_id=workspace_id,
        action=action,
        entity_type=entity_type,
        entity_id=entity_id,
        metadata_=metadata_,
        id_address=id_address
    )
    db.add(new_log)
    db.commit()
    db.refresh(new_log)
    return new_log


def get_project_activity_logs(db: Session, project_id: int, current_user_id: int, limit: int = 50):
    """
    Fetches activity logs for a project based on user permissions.
    - Owners and permitted members see everything.
    - Normal users see only their own actions.
    """
    # Check if user is owner
    project = db.query(Project).filter(Project.project_id == project_id).first()
    is_owner = project and project.user_id == current_user_id

    # Check member permissions
    member = db.query(ProjectMember).filter(
        ProjectMember.project_id == project_id,
        ProjectMember.user_id == current_user_id
    ).first()

    has_view_permission = member and member.can_view_activity_log

    query = db.query(ActivityLog).filter(ActivityLog.project_id == project_id)

    if not (is_owner or has_view_permission):
        # Normal user sees only their own logs
        query = query.filter(ActivityLog.user_id == current_user_id)

    return query.order_by(ActivityLog.created_at.desc()).limit(limit).all()

def get_personal_activity_logs(db: Session, current_user_id: int, limit: int = 100):
    """
    Fetches activity logs for a specific user across the entire platform.
    """
    query = db.query(ActivityLog).filter(ActivityLog.user_id == current_user_id)
    return query.order_by(ActivityLog.created_at.desc()).limit(limit).all()
