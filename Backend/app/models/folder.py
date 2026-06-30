from sqlalchemy import Column, BigInteger, String, DateTime, ForeignKey, func
from sqlalchemy.orm import relationship
from app.database.db import Base

class Folder(Base):
    __tablename__ = "folders"

    folder_id = Column(BigInteger, primary_key=True, index=True, autoincrement=True)
    workspace_id = Column(BigInteger, ForeignKey("workspaces.workspace_id"), nullable=False)
    parent_folder_id = Column(BigInteger, ForeignKey("folders.folder_id"), nullable=True)
    folder_name = Column(String(100), nullable=False)
    created_by_user_id = Column(BigInteger, nullable=False)
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now(), nullable=False)

    # Relationships
    workspace = relationship("Workspace", back_populates="folders")
    subfolders = relationship("Folder", backref="parent", remote_side=[folder_id])
    files = relationship("File", back_populates="folder", cascade="all, delete-orphan")
