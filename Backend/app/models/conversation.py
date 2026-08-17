from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, ForeignKey, Enum as SQLEnum
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database.db import Base
import enum

class ConversationType(str, enum.Enum):
    Project = "Project"
    Team = "Team"
    Private = "Private"
    System = "System"
    Ai = "Ai"

class Conversation(Base):
    __tablename__ = "conversations"

    conversation_id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    project_id = Column(Integer, ForeignKey("projects.project_id"), nullable=False)
    created_by_user_id = Column(Integer, ForeignKey("users.user_id"), nullable=False)
    conversation_name = Column(String(200), nullable=False)
    conversation_type = Column(SQLEnum(ConversationType), nullable=False)
    description = Column(Text, nullable=True)
    is_private = Column(Boolean, default=False, nullable=False)
    is_archived = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    members = relationship("ConversationMember", back_populates="conversation")
    messages = relationship("Message", back_populates="conversation")
