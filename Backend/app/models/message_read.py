from sqlalchemy import Column, Integer, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database.db import Base

class MessageRead(Base):
    __tablename__ = "message_reads"

    message_read_id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    message_id = Column(Integer, ForeignKey("messages.message_id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.user_id"), nullable=False)
    read_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    message = relationship("Message", back_populates="reads")
