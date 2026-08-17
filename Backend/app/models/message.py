from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, ForeignKey, Enum as SQLEnum
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database.db import Base
import enum

class MessageType(str, enum.Enum):
    Text = "Text"
    Code = "Code"
    File = "File"
    Image = "Image"
    System = "System"
    Ai = "Ai"
    Audio = "Audio"
    Video = "Video"

class Message(Base):
    __tablename__ = "messages"

    message_id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    conversation_id = Column(Integer, ForeignKey("conversations.conversation_id"), nullable=False)
    sender_id = Column(Integer, ForeignKey("users.user_id"), nullable=False)
    reply_to_message_id = Column(Integer, ForeignKey("messages.message_id"), nullable=True)
    message_type = Column(SQLEnum(MessageType), nullable=False)
    content = Column(Text, nullable=False)
    attachment_url = Column(Text, nullable=True)
    attachment_type = Column(String(50), nullable=True)
    is_pinned = Column(Boolean, default=False, nullable=False)
    is_forwarded = Column(Boolean, default=False, nullable=False)
    is_edited = Column(Boolean, default=False, nullable=False)
    is_deleted = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    conversation = relationship("Conversation", back_populates="messages")
    reads = relationship("MessageRead", back_populates="message")
