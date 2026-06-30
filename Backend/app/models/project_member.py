from sqlalchemy import Column, Integer, Boolean, DateTime, ForeignKey, Enum as SQLEnum, func
import enum
from app.database.db import Base

class ProjectMemberRole(str, enum.Enum):
    OWNER = "Owner"
    LEADER = "Leader"
    MEMBER = "Member"
    GUEST = "Guest"

class ProjectMember(Base):
    __tablename__ = "project_members"

    project_member_id = Column(Integer, primary_key=True, autoincrement=True)
    project_id = Column(Integer, ForeignKey("projects.project_id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.user_id"), nullable=False)
    project_role = Column(
        SQLEnum(ProjectMemberRole, values_callable=lambda obj: [e.value for e in obj]),
        nullable=False
    )
    managed_by_user_id = Column(Integer, nullable=True)
    invited_by_user_id = Column(Integer, nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    joined_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
