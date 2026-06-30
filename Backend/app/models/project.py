from sqlalchemy import (
    Column,
    Integer,
    String,
    Boolean,
    DateTime,
    Text,
    func,
    Enum as SQLEnum,
    ForeignKey
)
from sqlalchemy.orm import relationship
import enum
from app.database.db import Base

class ProjectVisibility(str, enum.Enum):
    PRIVATE = "Private"
    PUBLIC = "Public"
    SHARED = "Shared"

class Project(Base):
    __tablename__ = "projects"

    project_id = Column(Integer, primary_key=True, autoincrement=True)
    created_by_user_id = Column(Integer, ForeignKey("users.user_id"), nullable=False)
    
    project_name = Column(String(255), nullable=False)
    project_description = Column(Text, nullable=True)
    project_visibility = Column(
        SQLEnum(ProjectVisibility, values_callable=lambda obj: [e.value for e in obj]),
        default=ProjectVisibility.PRIVATE,
        nullable=False
    )
    project_avatar_url = Column(String(500), nullable=True)
    is_private = Column(Boolean, default=True, nullable=False)
    is_archived = Column(Boolean, default=False, nullable=False)
    
    # New columns added for UI support
    language_stack = Column(String(50), nullable=True, default="TypeScript")
    accent_color = Column(String(20), nullable=True, default="blue")
    status = Column(String(20), nullable=True, default="Draft")
    invite_code = Column(String(50), nullable=True, unique=True)
    
    # Soft deletion
    is_deleted = Column(Boolean, default=False, nullable=False)
    deleted_at = Column(DateTime(timezone=True), nullable=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False
    )

    # Relationships
    owner = relationship("User")

