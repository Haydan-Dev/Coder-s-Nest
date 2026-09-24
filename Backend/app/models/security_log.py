from sqlalchemy import Column, Integer, String, Text, Enum, JSON, DateTime, ForeignKey, BigInteger
from sqlalchemy.sql import func
from app.database.db import Base
import enum

class SecuritySeverity(str, enum.Enum):
    Low = "Low"
    Medium = "Medium"
    High = "High"
    Critical = "Critical"

class SecurityStatus(str, enum.Enum):
    Success = "Success"
    Failed = "Failed"
    Blocked = "Blocked"

class SecurityLog(Base):
    __tablename__ = "security_logs"

    security_log_id = Column(BigInteger, primary_key=True, autoincrement=True)
    user_id = Column(BigInteger, ForeignKey("users.user_id", ondelete="SET NULL"), nullable=True)
    event_type = Column(String(100), nullable=False)
    ip_address = Column(String(100), nullable=False)
    user_agent = Column(Text, nullable=False)
    location = Column(String(150), nullable=True)
    status = Column(Enum(SecurityStatus), nullable=False)
    metadata_ = Column("metadata", JSON, nullable=True)
    attempted_email = Column(String(255), nullable=True)
    severity = Column(Enum(SecuritySeverity), default=SecuritySeverity.Low)
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
