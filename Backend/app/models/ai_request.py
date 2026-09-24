from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, BigInteger
from sqlalchemy.sql import func
from app.database.db import Base

class AIRequest(Base):
    __tablename__ = "ai_requests"

    ai_request_id = Column(BigInteger, primary_key=True, autoincrement=True)
    ai_conversation_id = Column(BigInteger, nullable=False)
    user_id = Column(BigInteger, ForeignKey("users.user_id", ondelete="CASCADE"), nullable=False)
    prompt = Column(Text(4294967295), nullable=False) # longtext
    response = Column(Text(4294967295), nullable=False)
    model_name = Column(String(100), nullable=False)
    tokens_used = Column(Integer, nullable=False, default=0)
    latency_ms = Column(Integer, nullable=True)
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
