from sqlalchemy.orm import Session
from sqlalchemy import func
from fastapi import HTTPException
from datetime import datetime, timezone
import math

from app.models.project import Project, ProjectVisibility
from app.models.project_member import ProjectMember, ProjectMemberRole
from app.models.project_invitation import ProjectInvitation, ProjectInvitationRole, ProjectInvitationType, ProjectInvitationStatus
from app.models.user import User
from app.schemas.project import ProjectCreate, ProjectUpdate, ProjectResponse
from app.models.workspace import Workspace
from app.models.folder import Folder
import string
import random

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
        # Projects owned by user
        owned_projects = db.query(Project).filter(Project.created_by_user_id == user_id, Project.is_deleted == False).all()
        
        # Projects joined by user
        member_project_ids = [m.project_id for m in db.query(ProjectMember).filter(ProjectMember.user_id == user_id, ProjectMember.is_active == True).all()]
        joined_projects = db.query(Project).filter(Project.project_id.in_(member_project_ids), Project.is_deleted == False).all() if member_project_ids else []
        
        # Merge unique projects (in case owner is also somehow in members)
        all_projects = {p.project_id: p for p in owned_projects + joined_projects}
        
        # Mocks owner name, ideally fetch per project
        user = db.query(User).filter(User.user_id == user_id).first()
        owner_name = user.full_name if user else "User"
        
        return [ProjectService._map_to_response(p, owner_name) for p in all_projects.values()]

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
        db.flush() # Flush to get the new_project.project_id
        
        # Auto-create Default Workspace
        new_workspace = Workspace(
            project_id=new_project.project_id,
            workspace_name=data.name,
            created_by_user_id=user_id,
            is_default=True
        )
        db.add(new_workspace)
        db.flush() # Flush to get new_workspace.workspace_id
        
        # Auto-create Root Folder
        root_folder = Folder(
            workspace_id=new_workspace.workspace_id,
            folder_name="root",
            parent_folder_id=None,
            created_by_user_id=user_id
        )
        db.add(root_folder)
        
        db.commit()
        db.refresh(new_project)
        
        user = db.query(User).filter(User.user_id == user_id).first()
        owner_name = user.full_name if user else "User"
        
        return ProjectService._map_to_response(new_project, owner_name)

    @staticmethod
    def update_project(project_id: int, user_id: int, data: ProjectUpdate, db: Session):
        project = db.query(Project).filter(Project.project_id == project_id, Project.created_by_user_id == user_id, Project.is_deleted == False).first()
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
        project = db.query(Project).filter(Project.project_id == project_id, Project.created_by_user_id == user_id, Project.is_deleted == False).first()
        if not project:
            raise HTTPException(status_code=404, detail="Project not found")

        project.is_deleted = True
        project.deleted_at = func.now()
        db.commit()
        
        return {"message": "Project moved to bin successfully"}

    @staticmethod
    def get_deleted_projects(user_id: int, db: Session):
        projects = db.query(Project).filter(Project.created_by_user_id == user_id, Project.is_deleted == True).all()
        user = db.query(User).filter(User.user_id == user_id).first()
        owner_name = user.full_name if user else "User"
        
        return [ProjectService._map_to_response(p, owner_name) for p in projects]

    @staticmethod
    def restore_project(project_id: int, user_id: int, db: Session):
        project = db.query(Project).filter(Project.project_id == project_id, Project.created_by_user_id == user_id, Project.is_deleted == True).first()
        if not project:
            raise HTTPException(status_code=404, detail="Project not found in bin")

        project.is_deleted = False
        project.deleted_at = None
        db.commit()
        db.refresh(project)
        
        user = db.query(User).filter(User.user_id == user_id).first()
        owner_name = user.full_name if user else "User"
        
        return ProjectService._map_to_response(project, owner_name)

    @staticmethod
    def hard_delete_project(project_id: int, user_id: int, db: Session):
        project = db.query(Project).filter(Project.project_id == project_id, Project.created_by_user_id == user_id, Project.is_deleted == True).first()
        if not project:
            raise HTTPException(status_code=404, detail="Project not found in bin")

        db.delete(project)
        db.commit()
        
        return {"message": "Project permanently deleted"}

    @staticmethod
    def generate_invite_code(project_id: int, user_id: int, db: Session):
        project = db.query(Project).filter(Project.project_id == project_id, Project.created_by_user_id == user_id).first()
        if not project:
            raise HTTPException(status_code=404, detail="Project not found or you are not the owner")

        # Generate a random 9 character string X8J-9M2-KQL
        chars = string.ascii_uppercase + string.digits
        def gen_part():
            return ''.join(random.choices(chars, k=3))
            
        new_code = f"{gen_part()}-{gen_part()}-{gen_part()}"
        project.invite_code = new_code
        db.commit()
        
        return {"invite_code": new_code}

    @staticmethod
    def join_by_code(code: str, user_id: int, db: Session):
        project = db.query(Project).filter(Project.invite_code == code, Project.is_deleted == False).first()
        if not project:
            raise HTTPException(status_code=404, detail="Invalid or expired invite code")
            
        if project.created_by_user_id == user_id:
            raise HTTPException(status_code=400, detail="You already own this project")
            
        existing_member = db.query(ProjectMember).filter(ProjectMember.project_id == project.project_id, ProjectMember.user_id == user_id).first()
        if existing_member:
            raise HTTPException(status_code=400, detail="You are already a member of this project")
            
        new_member = ProjectMember(
            project_id=project.project_id,
            user_id=user_id,
            project_role=ProjectMemberRole.MEMBER
        )
        db.add(new_member)
        db.commit()
        
        return {"message": "Successfully joined project", "project_id": project.project_id}

    @staticmethod
    def invite_user_by_email(project_id: int, user_id: int, email: str, db: Session):
        project = db.query(Project).filter(Project.project_id == project_id, Project.created_by_user_id == user_id).first()
        if not project:
            raise HTTPException(status_code=404, detail="Project not found or you are not the owner")
            
        target_user = db.query(User).filter(User.email == email).first()
        if not target_user:
            raise HTTPException(status_code=404, detail="User not found! Ask your friend to create an account first.")
            
        if target_user.user_id == user_id:
            raise HTTPException(status_code=400, detail="You cannot invite yourself")
            
        existing_member = db.query(ProjectMember).filter(ProjectMember.project_id == project_id, ProjectMember.user_id == target_user.user_id).first()
        if existing_member:
            raise HTTPException(status_code=400, detail="User is already a member of this project")
            
        existing_invite = db.query(ProjectInvitation).filter(ProjectInvitation.project_id == project_id, ProjectInvitation.invite_user_id == target_user.user_id, ProjectInvitation.invitation_status == ProjectInvitationStatus.PENDING).first()
        if existing_invite:
            raise HTTPException(status_code=400, detail="User already has a pending invitation to this project")
            
        # create invite (expires in 7 days for example)
        from datetime import timedelta
        expires_at = datetime.now(timezone.utc) + timedelta(days=7)
        
        new_invite = ProjectInvitation(
            project_id=project_id,
            invite_user_id=target_user.user_id,
            invited_by_user_id=user_id,
            invitation_role=ProjectInvitationRole.MEMBER,
            invitation_type=ProjectInvitationType.PROJECT_INVITE,
            expires_at=expires_at
        )
        db.add(new_invite)
        db.commit()
        
        return {"message": f"Successfully invited {email}"}

    @staticmethod
    def get_user_invitations(user_id: int, db: Session):
        invites = db.query(ProjectInvitation).filter(
            ProjectInvitation.invite_user_id == user_id
        ).order_by(ProjectInvitation.created_at.desc()).all()
        
        result = []
        for inv in invites:
            project = db.query(Project).filter(Project.project_id == inv.project_id).first()
            inviter = db.query(User).filter(User.user_id == inv.invited_by_user_id).first()
            inviter_name = inviter.full_name if inviter else "Someone"
            project_name = project.project_name if project else "a project"
            
            initials = "".join([part[0].upper() for part in inviter_name.split() if part]) if inviter_name else "U"
            
            result.append({
                "id": inv.project_invitation_id,
                "unread": inv.invitation_status == ProjectInvitationStatus.PENDING,
                "type": "invite",
                "avatar": initials,
                "gradient": project.accent_color if project else "linear-gradient(135deg,#3b82f6,#2563eb)", # can just pass color or gradient
                "text": f"{inviter_name} invited you to join {project_name}",
                "time": time_ago(inv.created_at),
                "status": inv.invitation_status.value
            })
            
        return result

    @staticmethod
    def accept_invitation(invitation_id: int, user_id: int, db: Session):
        invite = db.query(ProjectInvitation).filter(
            ProjectInvitation.project_invitation_id == invitation_id,
            ProjectInvitation.invite_user_id == user_id,
            ProjectInvitation.invitation_status == ProjectInvitationStatus.PENDING
        ).first()
        
        if not invite:
            raise HTTPException(status_code=404, detail="Invitation not found or already processed")
            
        invite.invitation_status = ProjectInvitationStatus.ACCEPTED
        invite.responded_at = func.now()
        
        new_member = ProjectMember(
            project_id=invite.project_id,
            user_id=user_id,
            project_role=ProjectMemberRole.MEMBER,
            invited_by_user_id=invite.invited_by_user_id
        )
        db.add(new_member)
        db.commit()
        return {"message": "Invitation accepted"}

    @staticmethod
    def reject_invitation(invitation_id: int, user_id: int, db: Session):
        invite = db.query(ProjectInvitation).filter(
            ProjectInvitation.project_invitation_id == invitation_id,
            ProjectInvitation.invite_user_id == user_id,
            ProjectInvitation.invitation_status == ProjectInvitationStatus.PENDING
        ).first()
        
        if not invite:
            raise HTTPException(status_code=404, detail="Invitation not found or already processed")
            
        invite.invitation_status = ProjectInvitationStatus.REJECTED
        invite.responded_at = func.now()
        db.commit()
        return {"message": "Invitation rejected"}
