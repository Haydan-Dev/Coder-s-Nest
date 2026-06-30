from sqlalchemy import Column, Integer, DateTime, ForeignKey, Enum as SQLEnum, func
import enum
from app.database.db import Base

class ProjectInvitationRole(str, enum.Enum):
    OWNER = "Owner"
    LEADER = "Leader"
    MEMBER = "Member"
    GUEST = "Guest"

class ProjectInvitationType(str, enum.Enum):
    PROJECT_INVITE = "Project_Invite"
    OWNERSHIP_TRANSFER = "Ownership_Transfer"

class ProjectInvitationStatus(str, enum.Enum):
    PENDING = "Pending"
    ACCEPTED = "Accepted"
    REJECTED = "Rejected"
    CANCELLED = "Cancelled"
    EXPIRED = "Expired"

class ProjectInvitation(Base):
    __tablename__ = "project_invitations"

    project_invitation_id = Column(Integer, primary_key=True, autoincrement=True)
    project_id = Column(Integer, ForeignKey("projects.project_id"), nullable=False)
    invite_user_id = Column(Integer, ForeignKey("users.user_id"), nullable=False)
    invited_by_user_id = Column(Integer, ForeignKey("users.user_id"), nullable=False)
    
    invitation_role = Column(
        SQLEnum(ProjectInvitationRole, values_callable=lambda obj: [e.value for e in obj]),
        nullable=False
    )
    invitation_type = Column(
        SQLEnum(ProjectInvitationType, values_callable=lambda obj: [e.value for e in obj]),
        nullable=False
    )
    invitation_status = Column(
        SQLEnum(ProjectInvitationStatus, values_callable=lambda obj: [e.value for e in obj]),
        nullable=False,
        default=ProjectInvitationStatus.PENDING
    )
    
    expires_at = Column(DateTime(timezone=True), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    responded_at = Column(DateTime(timezone=True), nullable=True)
