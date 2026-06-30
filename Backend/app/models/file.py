from sqlalchemy import Column, BigInteger, String, Text, Boolean, DateTime, ForeignKey, func
from sqlalchemy.orm import relationship
from app.database.db import Base

class File(Base):
    __tablename__ = "files"

    file_id = Column(BigInteger, primary_key=True, index=True, autoincrement=True)
    workspace_id = Column(BigInteger, ForeignKey("workspaces.workspace_id"), nullable=False)
    folder_id = Column(BigInteger, ForeignKey("folders.folder_id"), nullable=True) # API enforces folder
    file_name = Column(String(100), nullable=False)
    file_extension = Column(String(20), nullable=False)
    mime_type = Column(String(100), nullable=False)
    file_content = Column(Text(4294967295), nullable=False) # longtext
    file_size = Column(BigInteger, nullable=False)
    created_by_user_id = Column(BigInteger, nullable=False)
    last_edited_by_user_id = Column(BigInteger, nullable=True)
    is_deleted = Column(Boolean, nullable=False, default=False)
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now(), nullable=False)

    # Relationships
    workspace = relationship("Workspace", back_populates="files")
    folder = relationship("Folder", back_populates="files")
