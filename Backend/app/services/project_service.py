from sqlalchemy.orm import Session
from sqlalchemy import func
from fastapi import HTTPException
from datetime import datetime, timezone
import math
import io
import zipfile
from fastapi.responses import StreamingResponse

from app.models.project import Project, ProjectVisibility
from app.models.project_member import ProjectMember, ProjectMemberRole
from app.models.project_invitation import ProjectInvitation, ProjectInvitationRole, ProjectInvitationType, ProjectInvitationStatus
from app.schemas.project import ProjectCreate, ProjectUpdate, ProjectResponse
from app.models.user import User
from app.models.workspace import Workspace
from app.models.file import File
from app.models.folder import Folder
from app.services.activity_log_service import log_activity
from app.models.activity_log import ActivityLog
from app.services.permission_service import PermissionService
from app.services.notification_service import NotificationService
import string
import random

def time_ago(dt: datetime) -> str:
    if not dt:
        return "Unknown"
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
    def _map_to_response(project: Project, members_data: list, workspaces_data: list, my_permissions: dict = None, activity_logs: list = None) -> dict:
        # Map enum to frontend access string
        access = "private"
        if project.project_visibility == ProjectVisibility.PUBLIC:
            access = "public"
        elif project.project_visibility == ProjectVisibility.SHARED:
            access = "shared"
            
        return {
            "id": project.project_id,
            "name": project.project_name,
            "desc": project.project_description or "",
            "lang": project.language_stack or "TypeScript",
            "color": project.accent_color or "blue",
            "status": project.status or "Draft",
            "access": access,
            "updated": time_ago(project.updated_at),
            "user_id": project.created_by_user_id,
            "members": members_data,
            "workspaces": workspaces_data,
            "my_permissions": my_permissions or {},
            "activity_logs": activity_logs or []
        }

    @staticmethod
    def _get_project_details(project_id: int, project_name: str, db: Session, user_id: int = None):
        members = db.query(ProjectMember, User).join(User, ProjectMember.user_id == User.user_id).filter(ProjectMember.project_id == project_id, ProjectMember.is_active == True).all()
        members_data = []
        for pm, u in members:
            online = False
            if u.last_seen_at:
                if u.last_seen_at.tzinfo is None:
                    last_seen = u.last_seen_at.replace(tzinfo=timezone.utc)
                else:
                    last_seen = u.last_seen_at
                diff = datetime.now(timezone.utc) - last_seen
                if diff.total_seconds() < 900:  # 15 mins
                    online = True
            
            initials = "".join([part[0].upper() for part in u.full_name.split() if part]) if u.full_name else "U"
            color = u.avatar_color or "#2563eb"
            role_str = pm.project_role.value if hasattr(pm.project_role, 'value') else str(pm.project_role)
            
            members_data.append({
                "user_id": u.user_id,
                "name": u.full_name,
                "init": initials,
                "role": role_str.lower(),
                "online": online,
                "color": color,
                "status": "suspended" if pm.is_suspended else "active"
            })
        
        workspaces = db.query(Workspace).filter(Workspace.project_id == project_id).all()
        workspaces_data = []
        for ws in workspaces:
            workspaces_data.append({
                "id": str(ws.workspace_id),
                "name": ws.workspace_name,
                "status": "active",
                "members": len(members_data),
                "emoji": project_name[:3].upper() if project_name else "WS"
            })
            
        my_permissions = {}
        if user_id:
            current_pm = db.query(ProjectMember).filter(ProjectMember.project_id == project_id, ProjectMember.user_id == user_id, ProjectMember.is_active == True).first()
            if current_pm:
                my_permissions = PermissionService.get_effective_permissions(current_pm)
                
        return members_data, workspaces_data, my_permissions

    @staticmethod
    def get_projects_for_user(user_id: int, db: Session):
        # Projects owned by user
        owned_projects = db.query(Project).filter(Project.created_by_user_id == user_id, Project.is_deleted == False).all()
        
        # Projects joined by user
        member_project_ids = [m.project_id for m in db.query(ProjectMember).filter(ProjectMember.user_id == user_id, ProjectMember.is_active == True).all()]
        joined_projects = db.query(Project).filter(Project.project_id.in_(member_project_ids), Project.is_deleted == False).all() if member_project_ids else []
        
        # Merge unique projects
        all_projects = {p.project_id: p for p in owned_projects + joined_projects}
        
        responses = []
        for project in all_projects.values():
            members_data, workspaces_data, my_permissions = ProjectService._get_project_details(project.project_id, project.project_name, db, user_id=user_id)
            responses.append(ProjectService._map_to_response(project, members_data, workspaces_data, my_permissions))
        return responses

    @staticmethod
    def download_project_code(project_id: int, user_id: int, db: Session):
        project = db.query(Project).filter(Project.project_id == project_id, Project.is_deleted == False).first()
        if not project:
            raise HTTPException(status_code=404, detail="Project not found")

        member = db.query(ProjectMember).filter(
            ProjectMember.project_id == project_id,
            ProjectMember.user_id == user_id
        ).first()

        if not member:
            if project.visibility != ProjectVisibility.PUBLIC:
                raise HTTPException(status_code=403, detail="Not authorized to download this project")
            # For public projects, we might allow download, but let's stick to members with permission for now
            raise HTTPException(status_code=403, detail="Only members can download code")
        
        if not member.can_download_code:
            raise HTTPException(status_code=403, detail="You do not have permission to download code for this project")

        workspace = db.query(Workspace).filter(Workspace.project_id == project_id).first()
        if not workspace:
            raise HTTPException(status_code=404, detail="Workspace not found")

        # Build folder paths
        folders = db.query(Folder).filter(Folder.workspace_id == workspace.workspace_id).all()
        files = db.query(File).filter(File.workspace_id == workspace.workspace_id).all()

        folder_paths = {}
        
        def get_folder_path(folder):
            if folder.folder_id in folder_paths:
                return folder_paths[folder.folder_id]
            if not folder.parent_folder_id:
                path = folder.folder_name
            else:
                parent = next((f for f in folders if f.folder_id == folder.parent_folder_id), None)
                if parent:
                    path = f"{get_folder_path(parent)}/{folder.folder_name}"
                else:
                    path = folder.folder_name
            
            # Root folder shouldn't be included as a prefix usually, but let's keep it to mirror the UI structure.
            if path.startswith("root/"):
                path = path[5:]
            elif path == "root":
                path = ""
                
            folder_paths[folder.folder_id] = path
            return path

        zip_buffer = io.BytesIO()
        with zipfile.ZipFile(zip_buffer, "w", zipfile.ZIP_DEFLATED) as zip_file:
            for file in files:
                folder = next((f for f in folders if f.folder_id == file.folder_id), None)
                folder_path = get_folder_path(folder) if folder else ""
                
                full_path = f"{folder_path}/{file.file_name}".lstrip("/")
                zip_file.writestr(full_path, file.file_content)
        
        zip_buffer.seek(0)
        
        headers = {
            "Content-Disposition": f"attachment; filename={project.project_name.replace(' ', '_')}_code.zip",
            "Access-Control-Expose-Headers": "Content-Disposition"
        }
        return StreamingResponse(
            iter([zip_buffer.getvalue()]), 
            media_type="application/zip", 
            headers=headers
        )

    @staticmethod
    def get_project_by_id(project_id: int, user_id: int, db: Session):
        project = db.query(Project).filter(Project.project_id == project_id, Project.is_deleted == False).first()
        if not project:
            raise HTTPException(status_code=404, detail="Project not found")
            
        # Verify access
        pm = db.query(ProjectMember).filter(ProjectMember.project_id == project_id, ProjectMember.user_id == user_id, ProjectMember.is_active == True).first()
        if not pm and project.created_by_user_id != user_id and project.project_visibility == ProjectVisibility.PRIVATE:
            raise HTTPException(status_code=403, detail="Access denied")
            
        if pm and pm.is_suspended:
            raise HTTPException(status_code=403, detail="Your access to this project has been suspended")
            
        members_data, workspaces_data, my_permissions = ProjectService._get_project_details(project.project_id, project.project_name, db, user_id=user_id)
        
        # Enforce RBAC for activity logs visibility
        has_full_view = False
        if project.created_by_user_id == user_id:
            has_full_view = True
        elif pm and getattr(pm, 'can_view_activity_log', False):
            has_full_view = True
            
        logs_query = db.query(ActivityLog, User).join(User, ActivityLog.user_id == User.user_id).filter(ActivityLog.project_id == project_id)
        if not has_full_view:
            logs_query = logs_query.filter(ActivityLog.user_id == user_id)
            
        logs = logs_query.order_by(ActivityLog.created_at.desc()).limit(50).all()
        activity_logs = []
        for log, user in logs:
            initials = "".join([part[0].upper() for part in user.full_name.split() if part]) if user.full_name else "U"
            activity_logs.append({
                "id": log.activity_log_id,
                "user_name": user.full_name,
                "user_init": initials,
                "user_color": user.avatar_color or "#2563eb",
                "action": log.action,
                "entity_type": log.entity_type,
                "metadata": log.metadata_,
                "time": time_ago(log.created_at)
            })
            
        return ProjectService._map_to_response(project, members_data, workspaces_data, my_permissions, activity_logs)

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
        
        # Add Owner to Project Members
        owner_member = ProjectMember(
            project_id=new_project.project_id,
            user_id=user_id,
            project_role=ProjectMemberRole.OWNER,
            can_edit_files=True,
            can_delete_files=True,
            can_rename_files=True,
            can_run_terminal=True,
            can_download_code=True,
            can_invite_members=True,
            can_manage_permissions=True
        )
        db.add(owner_member)
        db.commit()
        
        members_data, workspaces_data, my_permissions = ProjectService._get_project_details(new_project.project_id, new_project.project_name, db, user_id=user_id)
        return ProjectService._map_to_response(new_project, members_data, workspaces_data, my_permissions=my_permissions)

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
        
        members_data, workspaces_data, my_permissions = ProjectService._get_project_details(project.project_id, project.project_name, db, user_id=user_id)
        return ProjectService._map_to_response(project, members_data, workspaces_data, my_permissions=my_permissions)

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
        responses = []
        for p in projects:
            members_data, workspaces_data, my_permissions = ProjectService._get_project_details(p.project_id, p.project_name, db, user_id=user_id)
            responses.append(ProjectService._map_to_response(p, members_data, workspaces_data, my_permissions=my_permissions))
        return responses

    @staticmethod
    def restore_project(project_id: int, user_id: int, db: Session):
        project = db.query(Project).filter(Project.project_id == project_id, Project.created_by_user_id == user_id, Project.is_deleted == True).first()
        if not project:
            raise HTTPException(status_code=404, detail="Project not found in bin")

        project.is_deleted = False
        project.deleted_at = None
        db.commit()
        db.refresh(project)
        
        members_data, workspaces_data, my_permissions = ProjectService._get_project_details(project.project_id, project.project_name, db, user_id=user_id)
        return ProjectService._map_to_response(project, members_data, workspaces_data, my_permissions=my_permissions)

    @staticmethod
    def hard_delete_project(project_id: int, user_id: int, db: Session):
        project = db.query(Project).filter(Project.project_id == project_id, Project.created_by_user_id == user_id, Project.is_deleted == True).first()
        if not project:
            raise HTTPException(status_code=404, detail="Project not found in bin")

        # Manually delete dependencies since cascades might not be set up on DB level
        from app.models.project_member import ProjectMember
        from app.models.project_invitation import ProjectInvitation
        from app.models.workspace import Workspace
        from app.models.folder import Folder
        from app.models.file import File
        
        db.query(ProjectInvitation).filter(ProjectInvitation.project_id == project_id).delete()
        db.query(ProjectMember).filter(ProjectMember.project_id == project_id).delete()
        
        workspaces = db.query(Workspace).filter(Workspace.project_id == project_id).all()
        for ws in workspaces:
            db.query(File).filter(File.workspace_id == ws.workspace_id).delete()
            # Break self-referencing foreign key constraint before deleting folders
            db.query(Folder).filter(Folder.workspace_id == ws.workspace_id).update({"parent_folder_id": None})
            db.query(Folder).filter(Folder.workspace_id == ws.workspace_id).delete()
            db.delete(ws)
            
        db.delete(project)
        db.commit()
        
        return {"message": "Project permanently deleted"}

    @staticmethod
    def generate_invite_code(project_id: int, user_id: int, db: Session):
        project = db.query(Project).filter(Project.project_id == project_id).first()
        if not project:
            raise HTTPException(status_code=404, detail="Project not found")

        if project.created_by_user_id != user_id:
            member = db.query(ProjectMember).filter(ProjectMember.project_id == project_id, ProjectMember.user_id == user_id).first()
            if not member or not member.can_invite_members:
                raise HTTPException(status_code=403, detail="You do not have permission to invite members")

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
            project_role=ProjectMemberRole.MEMBER,
            can_edit_files=True,
            can_delete_files=True,
            can_rename_files=True,
            can_run_terminal=True,
            can_download_code=True,
            can_invite_members=False,
            can_manage_permissions=False
        )
        db.add(new_member)
        db.commit()
        
        return {"message": "Successfully joined project", "project_id": project.project_id}

    @staticmethod
    def invite_user_by_email(project_id: int, user_id: int, email: str, role: str, db: Session):
        project = db.query(Project).filter(Project.project_id == project_id).first()
        if not project:
            raise HTTPException(status_code=404, detail="Project not found")

        if project.created_by_user_id != user_id:
            member = db.query(ProjectMember).filter(ProjectMember.project_id == project_id, ProjectMember.user_id == user_id).first()
            if not member or not member.can_invite_members:
                raise HTTPException(status_code=403, detail="You do not have permission to invite members")
            
        target_user = db.query(User).filter(User.email == email).first()
        if not target_user:
            raise HTTPException(status_code=404, detail="User not found! Ask your friend to create an account first.")
            
        if target_user.user_id == user_id:
            raise HTTPException(status_code=400, detail="You cannot invite yourself")
            
        existing_member = db.query(ProjectMember).filter(ProjectMember.project_id == project_id, ProjectMember.user_id == target_user.user_id).first()
        if existing_member and existing_member.is_active:
            raise HTTPException(status_code=400, detail="User is already a member of this project")
            
        existing_invite = db.query(ProjectInvitation).filter(ProjectInvitation.project_id == project_id, ProjectInvitation.invite_user_id == target_user.user_id, ProjectInvitation.invitation_status == ProjectInvitationStatus.PENDING).first()
        if existing_invite:
            raise HTTPException(status_code=400, detail="User already has a pending invitation to this project")
            
        # create invite (expires in 7 days for example)
        from datetime import timedelta
        expires_at = datetime.now(timezone.utc) + timedelta(days=7)
        
        # Map frontend role strings to backend roles
        role_map = {
            "admin": ProjectInvitationRole.LEADER,
            "viewer": ProjectInvitationRole.GUEST,
            "member": ProjectInvitationRole.MEMBER
        }
        backend_role = role_map.get(role.lower(), ProjectInvitationRole.MEMBER) if role else ProjectInvitationRole.MEMBER

        new_invite = ProjectInvitation(
            project_id=project_id,
            invite_user_id=target_user.user_id,
            invited_by_user_id=user_id,
            invitation_role=backend_role,
            invitation_type=ProjectInvitationType.PROJECT_INVITE,
            expires_at=expires_at
        )
        db.add(new_invite)
        db.commit()
        db.refresh(new_invite)
        
        # Send Realtime Notification to Invitee
        inviter_name = db.query(User).filter(User.user_id == user_id).first().full_name
        project_name = project.project_name
        time_str = datetime.now().strftime("on %A, %d %b %Y at %I:%M %p")
        role_str = backend_role.value if hasattr(backend_role, 'value') else str(backend_role).split('.')[-1].lower()
        msg = f"{inviter_name} invited you to join '{project_name}' as a {role_str} {time_str}."
        NotificationService.send_personal_notification(
            db=db,
            user_id=target_user.user_id,
            type_="INVITE",
            title="New Project Invitation",
            message=msg,
            reference_id=project_id
        )
        
        # Send Notification to Inviter (Proof)
        msg_inviter = f"Invitation to {target_user.full_name} has been sent for project '{project_name}' {time_str}."
        NotificationService.send_personal_notification(
            db=db,
            user_id=user_id,
            type_="INVITE_SENT",
            title="Invitation Sent",
            message=msg_inviter,
            reference_id=project_id
        )
        
        # Log to Activity Log
        from app.services.activity_log_service import log_activity
        log_activity(
            db=db,
            user_id=user_id,
            project_id=project_id,
            action="invited_member",
            entity_type="USER",
            entity_id=str(target_user.user_id),
            metadata_={"email": target_user.email, "role": role or "member"}
        )
        
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
            
            time_str = inv.created_at.strftime("on %A, %d %b %Y at %I:%M %p")
            
            result.append({
                "id": inv.project_invitation_id,
                "unread": inv.invitation_status == ProjectInvitationStatus.PENDING,
                "type": "invite",
                "avatar": initials,
                "gradient": project.accent_color if project else "linear-gradient(135deg,#3b82f6,#2563eb)", # can just pass color or gradient
                "text": f"{inviter_name} invited you to join '{project_name}' as a {inv.invitation_role.value if hasattr(inv.invitation_role, 'value') else str(inv.invitation_role).split('.')[-1].lower()} {time_str}.",
                "time": time_ago(inv.created_at),
                "created_at": inv.created_at.isoformat(),
                "timestamp": inv.created_at.timestamp(),
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
        
        existing_member = db.query(ProjectMember).filter(ProjectMember.project_id == invite.project_id, ProjectMember.user_id == user_id).first()
        if existing_member:
            existing_member.is_active = True
            existing_member.project_role = ProjectMemberRole.MEMBER
            existing_member.invited_by_user_id = invite.invited_by_user_id
            existing_member.can_edit_files = True
            existing_member.can_delete_files = True
            existing_member.can_rename_files = True
            existing_member.can_run_terminal = True
            existing_member.can_download_code = True
            existing_member.can_invite_members = False
            existing_member.can_manage_permissions = False
        else:
            new_member = ProjectMember(
                project_id=invite.project_id,
                user_id=user_id,
                project_role=ProjectMemberRole.MEMBER,
                invited_by_user_id=invite.invited_by_user_id,
                can_edit_files=True,
                can_delete_files=True,
                can_rename_files=True,
                can_run_terminal=True,
                can_download_code=True,
                can_invite_members=False,
                can_manage_permissions=False
            )
            db.add(new_member)
        db.commit()
        
        # Send Notification to inviter
        accepting_user = db.query(User).filter(User.user_id == user_id).first()
        project = db.query(Project).filter(Project.project_id == invite.project_id).first()
        time_str = datetime.now().strftime("on %A, %d %b %Y at %I:%M %p")
        msg = f"{accepting_user.full_name} accepted your invitation to join '{project.project_name}' {time_str}."
        NotificationService.send_personal_notification(
            db=db,
            user_id=invite.invited_by_user_id,
            type_="INVITE_ACCEPTED",
            title="Invite Accepted",
            message=msg,
            reference_id=invite.project_id
        )
        
        # Send Notification to accepting user (Self Proof)
        inviter = db.query(User).filter(User.user_id == invite.invited_by_user_id).first()
        inviter_name = inviter.full_name if inviter else "Someone"
        msg_self = f"You accepted the invitation for '{project.project_name}' from {inviter_name} {time_str}."
        NotificationService.send_personal_notification(
            db=db,
            user_id=user_id,
            type_="INVITE_ACCEPTED_SELF",
            title="Invite Accepted",
            message=msg_self,
            reference_id=invite.project_id
        )
        
        # Log to Activity Log
        log_activity(
            db=db,
            user_id=user_id,
            project_id=invite.project_id,
            action="Accepted the project invitation",
            entity_type="MEMBER_JOINED",
            metadata_={"role": invite.invitation_role.value if hasattr(invite.invitation_role, 'value') else str(invite.invitation_role)}
        )
        
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
        
        # Send Notification to inviter
        rejecting_user = db.query(User).filter(User.user_id == user_id).first()
        project = db.query(Project).filter(Project.project_id == invite.project_id).first()
        time_str = datetime.now().strftime("on %A, %d %b %Y at %I:%M %p")
        msg = f"{rejecting_user.full_name} declined your invitation to join '{project.project_name}' {time_str}."
        NotificationService.send_personal_notification(
            db=db,
            user_id=invite.invited_by_user_id,
            type_="INVITE_REJECTED",
            title="Invite Declined",
            message=msg,
            reference_id=invite.project_id
        )

        # Send Notification to rejecting user (Self Proof)
        inviter = db.query(User).filter(User.user_id == invite.invited_by_user_id).first()
        inviter_name = inviter.full_name if inviter else "Someone"
        msg_self = f"You declined the invitation for '{project.project_name}' from {inviter_name} {time_str}."
        NotificationService.send_personal_notification(
            db=db,
            user_id=user_id,
            type_="INVITE_REJECTED_SELF",
            title="Invite Declined",
            message=msg_self,
            reference_id=invite.project_id
        )
        
        # Log to Activity Log
        log_activity(
            db=db,
            user_id=user_id,
            project_id=invite.project_id,
            action="Declined the project invitation",
            entity_type="MEMBER_DECLINED"
        )
        
        return {"message": "Invitation rejected"}

    @staticmethod
    def get_project_members_permissions(project_id: int, user_id: int, db: Session):
        pm = db.query(ProjectMember).filter(ProjectMember.project_id == project_id, ProjectMember.user_id == user_id, ProjectMember.is_active == True).first()
        if not pm:
            raise HTTPException(status_code=403, detail="Access denied")
            
        members = db.query(ProjectMember, User).join(User, ProjectMember.user_id == User.user_id).filter(ProjectMember.project_id == project_id, ProjectMember.is_active == True).all()
        result = []
        for member_pm, u in members:
            online = False
            if u.last_seen_at:
                if u.last_seen_at.tzinfo is None:
                    last_seen = u.last_seen_at.replace(tzinfo=timezone.utc)
                else:
                    last_seen = u.last_seen_at
                diff = datetime.now(timezone.utc) - last_seen
                if diff.total_seconds() < 900:
                    online = True
            
            initials = "".join([part[0].upper() for part in u.full_name.split() if part]) if u.full_name else "U"
            color = u.avatar_color or "#2563eb"
            role_str = member_pm.project_role.value if hasattr(member_pm.project_role, 'value') else str(member_pm.project_role)
            
            result.append({
                "user_id": u.user_id,
                "name": u.full_name,
                "email": u.email,
                "init": initials,
                "color": color,
                "role": role_str.lower(),
                "online": online,
                "status": "suspended" if member_pm.is_suspended else "active",
                "last": time_ago(u.last_seen_at) if u.last_seen_at else "Never",
                "joined": time_ago(member_pm.joined_at) if member_pm.joined_at else "Recently",
                "can_edit_files": member_pm.can_edit_files,
                "can_rename_files": member_pm.can_rename_files,
                "can_delete_files": member_pm.can_delete_files,
                "can_run_terminal": member_pm.can_run_terminal,
                "can_download_code": member_pm.can_download_code,
                "can_invite_members": member_pm.can_invite_members,
                "can_manage_permissions": member_pm.can_manage_permissions,
                "can_manage_roles": member_pm.can_manage_roles,
                "can_view_activity_log": member_pm.can_view_activity_log
            })
        return result

    @staticmethod
    def update_member_permissions(project_id: int, target_user_id: int, data: dict, current_user_id: int, db: Session):
        pm_current = db.query(ProjectMember).filter(ProjectMember.project_id == project_id, ProjectMember.user_id == current_user_id, ProjectMember.is_active == True).first()
        if not pm_current or (pm_current.project_role != ProjectMemberRole.OWNER and not pm_current.can_manage_permissions):
            raise HTTPException(status_code=403, detail="You do not have permission to manage permissions")
            
        pm_target = db.query(ProjectMember).filter(ProjectMember.project_id == project_id, ProjectMember.user_id == target_user_id, ProjectMember.is_active == True).first()
        if not pm_target:
            raise HTTPException(status_code=404, detail="Member not found")
            
        if pm_target.project_role == ProjectMemberRole.OWNER and current_user_id != target_user_id:
            raise HTTPException(status_code=403, detail="Cannot modify owner permissions")
            
        changes = []
        for key in ['can_edit_files', 'can_rename_files', 'can_delete_files', 'can_run_terminal', 'can_download_code', 'can_invite_members', 'can_manage_permissions', 'can_manage_roles', 'can_view_activity_log']:
            if key in data:
                old_val = getattr(pm_target, key, False)
                new_val = data[key]
                if old_val != new_val:
                    setattr(pm_target, key, new_val)
                    changes.append((key, new_val))
        
        db.commit()
        
        if changes:
            target_user = db.query(User).filter(User.user_id == target_user_id).first()
            target_email = target_user.email if target_user else ""
            admin_user = db.query(User).filter(User.user_id == current_user_id).first()
            admin_name = admin_user.full_name if admin_user else "an Admin"
            admin_role = pm_current.project_role.value if hasattr(pm_current.project_role, 'value') else str(pm_current.project_role).split('.')[-1].capitalize()
            project = db.query(Project).filter(Project.project_id == project_id).first()
            project_name = project.project_name if project else "the project"
            
            from app.services.activity_log_service import log_activity
            
            for key, new_val in changes:
                perm_name = key.replace('can_', '').replace('_', ' ').title()
                action_type = "enabled_permission" if new_val else "disabled_permission"
                
                # Log Activity
                log_activity(
                    db=db,
                    user_id=current_user_id,
                    project_id=project_id,
                    action=action_type,
                    entity_type="USER",
                    entity_id=str(target_user_id),
                    metadata_={"email": target_email, "permission": perm_name}
                )
                
                # Send Notification
                msg = f"Your permission to '{perm_name}' has been {'enabled' if new_val else 'disabled'} in project '{project_name}' by the project {admin_role.lower()} {admin_name}."
                NotificationService.send_personal_notification(
                    db=db,
                    user_id=target_user_id,
                    type_="PERMISSION_UPDATE",
                    title="Permission Updated",
                    message=msg,
                    reference_id=project_id
                )

        return {"message": "Permissions updated"}

    @staticmethod
    def update_member_role(project_id: int, target_user_id: int, data: dict, current_user_id: int, db: Session):
        pm_current = db.query(ProjectMember).filter(ProjectMember.project_id == project_id, ProjectMember.user_id == current_user_id, ProjectMember.is_active == True).first()
        if not pm_current or (pm_current.project_role != ProjectMemberRole.OWNER and not getattr(pm_current, 'can_manage_roles', False) and pm_current.project_role != ProjectMemberRole.LEADER):
            raise HTTPException(status_code=403, detail="You do not have permission to change roles")
            
        pm_target = db.query(ProjectMember).filter(ProjectMember.project_id == project_id, ProjectMember.user_id == target_user_id, ProjectMember.is_active == True).first()
        if not pm_target:
            raise HTTPException(status_code=404, detail="Member not found")
            
        if pm_target.project_role == ProjectMemberRole.OWNER and current_user_id != target_user_id:
            raise HTTPException(status_code=403, detail="Cannot modify owner role")
            
        new_role_str = data.get('role', '').upper()
        if hasattr(ProjectMemberRole, new_role_str):
            old_role = pm_target.project_role.value
            pm_target.project_role = getattr(ProjectMemberRole, new_role_str)
            db.commit()
            
            target_user = db.query(User).filter(User.user_id == target_user_id).first()
            target_email = target_user.email if target_user else ""
            
            from app.services.activity_log_service import log_activity
            log_activity(
                db=db,
                user_id=current_user_id,
                project_id=project_id,
                action="role_updated",
                entity_type="USER",
                entity_id=str(target_user_id),
                metadata_={"email": target_email, "role": new_role_str.capitalize()}
            )
            
            # Send Notification
            admin_user = db.query(User).filter(User.user_id == current_user_id).first()
            admin_name = admin_user.full_name if admin_user else "an Admin"
            admin_role = pm_current.project_role.value if hasattr(pm_current.project_role, 'value') else str(pm_current.project_role).split('.')[-1].capitalize()
            project = db.query(Project).filter(Project.project_id == project_id).first()
            project_name = project.project_name if project else "the project"
            msg = f"Your role in the project '{project_name}' has been changed from {old_role} to {new_role_str.capitalize()} by the project {admin_role.lower()} {admin_name}."
            NotificationService.send_personal_notification(
                db=db,
                user_id=target_user_id,
                type_="ROLE_UPDATE",
                title="Role Updated",
                message=msg,
                reference_id=project_id
            )
            
            return {"message": "Role updated"}
        else:
            raise HTTPException(status_code=400, detail="Invalid role")

    @staticmethod
    def remove_member(project_id: int, target_user_id: int, current_user_id: int, db: Session):
        pm_current = db.query(ProjectMember).filter(ProjectMember.project_id == project_id, ProjectMember.user_id == current_user_id, ProjectMember.is_active == True).first()
        if not pm_current or (pm_current.project_role != ProjectMemberRole.OWNER and pm_current.project_role != ProjectMemberRole.LEADER):
            raise HTTPException(status_code=403, detail="Only owners and leaders can remove members")
            
        pm_target = db.query(ProjectMember).filter(ProjectMember.project_id == project_id, ProjectMember.user_id == target_user_id, ProjectMember.is_active == True).first()
        if not pm_target:
            raise HTTPException(status_code=404, detail="Member not found")
            
        if pm_target.project_role == ProjectMemberRole.OWNER:
            raise HTTPException(status_code=403, detail="Cannot remove owner")
            
        pm_target.is_active = False
        db.commit()
        
        target_user = db.query(User).filter(User.user_id == target_user_id).first()
        target_email = target_user.email if target_user else ""
        
        from app.services.activity_log_service import log_activity
        log_activity(
            db=db,
            user_id=current_user_id,
            project_id=project_id,
            action="removed_member",
            entity_type="USER",
            entity_id=str(target_user_id),
            metadata_={"email": target_email}
        )
        
        # Send Notification
        admin_user = db.query(User).filter(User.user_id == current_user_id).first()
        admin_name = admin_user.full_name if admin_user else "an Admin"
        admin_role = pm_current.project_role.value if hasattr(pm_current.project_role, 'value') else str(pm_current.project_role).split('.')[-1].capitalize()
        project = db.query(Project).filter(Project.project_id == project_id).first()
        project_name = project.project_name if project else "the project"
        msg = f"You have been removed from the project '{project_name}' by the project {admin_role.lower()} {admin_name}."
        NotificationService.send_personal_notification(
            db=db,
            user_id=target_user_id,
            type_="KICK",
            title="Removed from Project",
            message=msg,
            reference_id=project_id
        )
        
        return {"message": "Member removed"}

    @staticmethod
    def suspend_member(project_id: int, target_user_id: int, current_user_id: int, db: Session):
        pm_current = db.query(ProjectMember).filter(ProjectMember.project_id == project_id, ProjectMember.user_id == current_user_id, ProjectMember.is_active == True).first()
        if not pm_current or (pm_current.project_role != ProjectMemberRole.OWNER and pm_current.project_role != ProjectMemberRole.LEADER):
            raise HTTPException(status_code=403, detail="Only owners and leaders can suspend members")
            
        pm_target = db.query(ProjectMember).filter(ProjectMember.project_id == project_id, ProjectMember.user_id == target_user_id, ProjectMember.is_active == True).first()
        if not pm_target:
            raise HTTPException(status_code=404, detail="Member not found")
            
        if pm_target.project_role == ProjectMemberRole.OWNER:
            raise HTTPException(status_code=403, detail="Cannot suspend owner")
            
        pm_target.is_suspended = True
        db.commit()
        
        target_user = db.query(User).filter(User.user_id == target_user_id).first()
        target_email = target_user.email if target_user else ""
        
        from app.services.activity_log_service import log_activity
        log_activity(
            db=db,
            user_id=current_user_id,
            project_id=project_id,
            action="suspended_member",
            entity_type="USER",
            entity_id=str(target_user_id),
            metadata_={"email": target_email}
        )
        
        # Send Notification
        admin_user = db.query(User).filter(User.user_id == current_user_id).first()
        admin_name = admin_user.full_name if admin_user else "an Admin"
        admin_role = pm_current.project_role.value if hasattr(pm_current.project_role, 'value') else str(pm_current.project_role).split('.')[-1].capitalize()
        project = db.query(Project).filter(Project.project_id == project_id).first()
        project_name = project.project_name if project else "the project"
        msg = f"You have been suspended from the project '{project_name}' by the project {admin_role.lower()} {admin_name}."
        NotificationService.send_personal_notification(
            db=db,
            user_id=target_user_id,
            type_="SUSPEND",
            title="Suspended",
            message=msg,
            reference_id=project_id
        )
        NotificationService.broadcast_project_event(db, project_id, "MEMBER_STATUS_UPDATE", {
            "user_id": target_user_id,
            "status": "suspended"
        })
        return {"message": "Member suspended"}

    @staticmethod
    def unsuspend_member(project_id: int, target_user_id: int, current_user_id: int, db: Session):
        pm_current = db.query(ProjectMember).filter(ProjectMember.project_id == project_id, ProjectMember.user_id == current_user_id, ProjectMember.is_active == True).first()
        if not pm_current or (pm_current.project_role != ProjectMemberRole.OWNER and pm_current.project_role != ProjectMemberRole.LEADER):
            raise HTTPException(status_code=403, detail="Only owners and leaders can unsuspend members")
            
        pm_target = db.query(ProjectMember).filter(ProjectMember.project_id == project_id, ProjectMember.user_id == target_user_id, ProjectMember.is_active == True).first()
        if not pm_target:
            raise HTTPException(status_code=404, detail="Member not found")
            
        pm_target.is_suspended = False
        db.commit()
        
        target_user = db.query(User).filter(User.user_id == target_user_id).first()
        target_email = target_user.email if target_user else ""
        
        from app.services.activity_log_service import log_activity
        log_activity(
            db=db,
            user_id=current_user_id,
            project_id=project_id,
            action="unsuspended_member",
            entity_type="USER",
            entity_id=str(target_user_id),
            metadata_={"email": target_email}
        )
        
        # Send Notification
        admin_user = db.query(User).filter(User.user_id == current_user_id).first()
        admin_name = admin_user.full_name if admin_user else "an Admin"
        admin_role = pm_current.project_role.value if hasattr(pm_current.project_role, 'value') else str(pm_current.project_role).split('.')[-1].capitalize()
        project = db.query(Project).filter(Project.project_id == project_id).first()
        project_name = project.project_name if project else "the project"
        msg = f"Your suspension in the project '{project_name}' has been lifted by the project {admin_role.lower()} {admin_name}."
        NotificationService.send_personal_notification(
            db=db,
            user_id=target_user_id,
            type_="UNSUSPEND",
            title="Unsuspended",
            message=msg,
            reference_id=project_id
        )
        NotificationService.broadcast_project_event(db, project_id, "MEMBER_STATUS_UPDATE", {
            "user_id": target_user_id,
            "status": "active"
        })
        return {"message": "Member unsuspended"}
