from fastapi import HTTPException
from sqlalchemy.orm import Session
from app.models.project_member import ProjectMember, ProjectMemberRole
from app.models.workspace import Workspace
from app.models.file import File
from app.models.folder import Folder

class PermissionService:
    @staticmethod
    def get_member_by_workspace(workspace_id: int, user_id: int, db: Session):
        workspace = db.query(Workspace).filter(Workspace.workspace_id == workspace_id).first()
        if not workspace:
            raise HTTPException(status_code=404, detail="Workspace not found")
            
        member = db.query(ProjectMember).filter(
            ProjectMember.project_id == workspace.project_id,
            ProjectMember.user_id == user_id,
            ProjectMember.is_active == True
        ).first()
        
        if not member:
            raise HTTPException(status_code=403, detail="You do not have access to this workspace")
            
        if member.is_suspended:
            raise HTTPException(status_code=403, detail="Your access to this workspace has been suspended")
            
        return member
        
    @staticmethod
    def get_member_by_file(file_id: int, user_id: int, db: Session):
        file = db.query(File).filter(File.file_id == file_id).first()
        if not file:
            raise HTTPException(status_code=404, detail="File not found")
        return PermissionService.get_member_by_workspace(file.workspace_id, user_id, db)

    @staticmethod
    def get_member_by_folder(folder_id: int, user_id: int, db: Session):
        folder = db.query(Folder).filter(Folder.folder_id == folder_id).first()
        if not folder:
            raise HTTPException(status_code=404, detail="Folder not found")
        return PermissionService.get_member_by_workspace(folder.workspace_id, user_id, db)
        
    @staticmethod
    def enforce_permission(member: ProjectMember, permission_key: str):
        if member.project_role == ProjectMemberRole.OWNER:
            return True
        if member.project_role == ProjectMemberRole.LEADER:
            # Leaders have all powers except delete project (which is handled at project level)
            # but manage_permissions is a specific toggle even for leaders.
            if permission_key == 'can_manage_permissions':
                if not member.can_manage_permissions:
                    raise HTTPException(status_code=403, detail="Permission denied: You cannot manage permissions")
            return True
            
        # For Members and Guests, strictly check the boolean column
        if not getattr(member, permission_key, False):
            raise HTTPException(status_code=403, detail=f"Permission denied: {permission_key.replace('_', ' ')}")
        return True

    @staticmethod
    def get_effective_permissions(member: ProjectMember):
        if member.project_role == ProjectMemberRole.OWNER:
            return {
                "role": member.project_role.value,
                "can_edit_files": True,
                "can_delete_files": True,
                "can_rename_files": True,
                "can_run_terminal": True,
                "can_download_code": True,
                "can_invite_members": True,
                "can_manage_permissions": True,
                "can_manage_roles": True,
                "can_view_activity_log": True
            }
        elif member.project_role == ProjectMemberRole.LEADER:
            return {
                "role": member.project_role.value,
                "can_edit_files": True,
                "can_delete_files": True,
                "can_rename_files": True,
                "can_run_terminal": True,
                "can_download_code": True,
                "can_invite_members": True,
                "can_manage_permissions": member.can_manage_permissions,
                "can_manage_roles": member.can_manage_roles,
                "can_view_activity_log": True
            }
        else:
            return {
                "role": member.project_role.value,
                "can_edit_files": member.can_edit_files,
                "can_delete_files": member.can_delete_files,
                "can_rename_files": member.can_rename_files,
                "can_run_terminal": member.can_run_terminal,
                "can_download_code": member.can_download_code,
                "can_invite_members": member.can_invite_members,
                "can_manage_permissions": member.can_manage_permissions,
                "can_manage_roles": member.can_manage_roles,
                "can_view_activity_log": member.can_view_activity_log
            }
