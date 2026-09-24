from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, BigInteger, Enum
from sqlalchemy.sql import func
from app.database.db import Base
import enum

class ExecutionStatus(str, enum.Enum):
    Success = "Success"
    Failed = "Failed"
    Timeout = "Timeout"

class CodeExecution(Base):
    __tablename__ = "code_executions"

    code_execution_id = Column(BigInteger, primary_key=True, autoincrement=True)
    user_id = Column(BigInteger, ForeignKey("users.user_id", ondelete="CASCADE"), nullable=False)
    project_id = Column(BigInteger, ForeignKey("projects.project_id", ondelete="CASCADE"), nullable=True)
    language = Column(String(50), nullable=False)
    status = Column(Enum(ExecutionStatus), nullable=False)
    execution_time_ms = Column(Integer, nullable=True)
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
