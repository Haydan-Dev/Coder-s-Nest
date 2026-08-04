from sqlalchemy import Column, Integer, String, JSON, DateTime, ForeignKey
from sqlalchemy.sql import func
from app.database.db import Base

class ActivityLog(Base):
    __tablename__ = "activity_logs"

    activity_log_id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.user_id", ondelete="CASCADE"), nullable=False)
    project_id = Column(Integer, ForeignKey("projects.project_id", ondelete="CASCADE"), nullable=True)
    workspace_id = Column(Integer, ForeignKey("workspaces.workspace_id", ondelete="CASCADE"), nullable=True)
    action = Column(String(50), nullable=False)
    entity_type = Column(String(50), nullable=True)
    entity_id = Column(String(50), nullable=True)
    metadata_ = Column("metadata", JSON, nullable=True)
    id_address = Column(String(45), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
