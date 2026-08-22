from sqlalchemy import Column, Integer, Text, DateTime, ForeignKey, String, Boolean, Enum
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database.db import Base

from app.models.message import MessageType

class DirectMessage(Base):
    __tablename__ = "direct_messages"

    message_id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    sender_id = Column(Integer, ForeignKey("users.user_id"), nullable=False)
    receiver_id = Column(Integer, ForeignKey("users.user_id"), nullable=False)
    content = Column(Text, nullable=False)
    
    # Advanced Chat Features
    reply_to_message_id = Column(Integer, ForeignKey("direct_messages.message_id"), nullable=True)
    message_type = Column(Enum(MessageType), default=MessageType.Text, nullable=False)
    attachment_url = Column(String(500), nullable=True)
    attachment_type = Column(String(50), nullable=True)
    is_pinned = Column(Boolean, default=False)
    is_forwarded = Column(Boolean, default=False)
    is_edited = Column(Boolean, default=False)
    is_deleted = Column(Boolean, default=False)
    
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    read_at = Column(DateTime, nullable=True)
    
    sender = relationship("User", foreign_keys=[sender_id])
    receiver = relationship("User", foreign_keys=[receiver_id])
    replies = relationship("DirectMessage")
