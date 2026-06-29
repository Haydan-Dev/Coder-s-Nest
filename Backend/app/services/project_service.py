from sqlalchemy.orm import Session
from fastapi import HTTPException
from datetime import datetime, timezone
import math

from app.models.project import Project, ProjectVisibility
from app.models.user import User
from app.schemas.project import ProjectCreate, ProjectUpdate, ProjectResponse

def time_ago(dt: datetime) -> str:
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    now = datetime.now(timezone.utc)
    diff = now - dt
    seconds = diff.total_seconds()
    
    if seconds < 60:
        return "just now"
    minutes = seconds / 60
    if minutes < 60:
        return f"{math.floor(minutes)} minutes ago"
    hours = minutes / 60
    if hours < 24:
        return f"{math.floor(hours)} hours ago"
    days = hours / 24
    if days < 7:
        return f"{math.floor(days)} days ago"
    weeks = days / 7
    return f"{math.floor(weeks)} weeks ago"


class ProjectService:

    @staticmethod
    def _map_to_response(project: Project, owner_name: str) -> dict:
        # Map enum to frontend access string
        access = "private"
        if project.project_visibility == ProjectVisibility.PUBLIC:
            access = "public"
        elif project.project_visibility == ProjectVisibility.SHARED:
            access = "shared"
            
        # Get initials for collaborator (just owner for now)
        initials = "".join([part[0].upper() for part in owner_name.split() if part]) if owner_name else "U"
            
        return {
            "id": project.project_id,
            "name": project.project_name,
            "desc": project.project_description or "",
            "lang": project.language_stack or "TypeScript",
            "color": project.accent_color or "blue",
            "status": project.status or "Draft",
            "access": access,
            "collaborators": [initials],
            "updated": time_ago(project.updated_at)
        }

    @staticmethod
    def get_projects_for_user(user_id: int, db: Session):
        projects = db.query(Project).filter(Project.created_by_user_id == user_id).all()
        # To get the owner's name for collaborators mock
        user = db.query(User).filter(User.user_id == user_id).first()
        owner_name = user.full_name if user else "User"
        
        return [ProjectService._map_to_response(p, owner_name) for p in projects]

    @staticmethod
    def create_project(user_id: int, data: ProjectCreate, db: Session):
        # Map frontend visibility string to Enum
        visibility = ProjectVisibility.PRIVATE
        if data.access.lower() == "public":
            visibility = ProjectVisibility.PUBLIC
        elif data.access.lower() == "shared":
            visibility = ProjectVisibility.SHARED
            
        new_project = Project(
            created_by_user_id=user_id,
            project_name=data.name,
            project_description=data.desc,
            project_visibility=visibility,
            project_avatar_url="",
            language_stack=data.lang,
            accent_color=data.color,
            status=data.status,
            is_private=(visibility == ProjectVisibility.PRIVATE)
        )
        db.add(new_project)
        db.commit()
        db.refresh(new_project)
        
        user = db.query(User).filter(User.user_id == user_id).first()
        owner_name = user.full_name if user else "User"
        
        return ProjectService._map_to_response(new_project, owner_name)

    @staticmethod
    def update_project(project_id: int, user_id: int, data: ProjectUpdate, db: Session):
        project = db.query(Project).filter(Project.project_id == project_id, Project.created_by_user_id == user_id).first()
        if not project:
            raise HTTPException(status_code=404, detail="Project not found")

        if data.name is not None:
            project.project_name = data.name
        if data.desc is not None:
            project.project_description = data.desc
        if data.lang is not None:
            project.language_stack = data.lang
        if data.color is not None:
            project.accent_color = data.color
        if data.status is not None:
            project.status = data.status
        if data.access is not None:
            if data.access.lower() == "public":
                project.project_visibility = ProjectVisibility.PUBLIC
            elif data.access.lower() == "shared":
                project.project_visibility = ProjectVisibility.SHARED
            else:
                project.project_visibility = ProjectVisibility.PRIVATE
            project.is_private = (project.project_visibility == ProjectVisibility.PRIVATE)

        db.commit()
        db.refresh(project)
        
        user = db.query(User).filter(User.user_id == user_id).first()
        owner_name = user.full_name if user else "User"
        
        return ProjectService._map_to_response(project, owner_name)

    @staticmethod
    def delete_project(project_id: int, user_id: int, db: Session):
        project = db.query(Project).filter(Project.project_id == project_id, Project.created_by_user_id == user_id).first()
        if not project:
            raise HTTPException(status_code=404, detail="Project not found")

        db.delete(project)
        db.commit()
        
        return {"message": "Project deleted successfully"}
