from sqlalchemy import Column, BigInteger, String, Text, Boolean, DateTime, func
from sqlalchemy.orm import relationship
from app.database.db import Base

class Workspace(Base):
    __tablename__ = "workspaces"

    workspace_id = Column(BigInteger, primary_key=True, index=True, autoincrement=True)
    project_id = Column(BigInteger, nullable=False)
    workspace_name = Column(String(100), nullable=False)
    workspace_description = Column(Text, nullable=True)
    created_by_user_id = Column(BigInteger, nullable=False)
    is_default = Column(Boolean, nullable=False, default=True)
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now(), nullable=False)

    # Relationships
    folders = relationship("Folder", back_populates="workspace", cascade="all, delete-orphan")
    files = relationship("File", back_populates="workspace", cascade="all, delete-orphan")
