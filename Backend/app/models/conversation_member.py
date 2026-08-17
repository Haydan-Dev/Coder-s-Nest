from sqlalchemy import Column, Integer, Boolean, DateTime, ForeignKey, Enum as SQLEnum
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database.db import Base
import enum

class MemberRole(str, enum.Enum):
    Admin = "Admin"
    Member = "Member"
    Leader = "Leader"
    Owner = "Owner"

class ConversationMember(Base):
    __tablename__ = "conversation_members"

    conversation_member_id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    conversation_id = Column(Integer, ForeignKey("conversations.conversation_id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.user_id"), nullable=False)
    member_role = Column(SQLEnum(MemberRole), nullable=False)
    joined_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    left_at = Column(DateTime, nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)

    conversation = relationship("Conversation", back_populates="members")
