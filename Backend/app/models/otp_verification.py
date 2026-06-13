from sqlalchemy import Column, Integer, String, Boolean, DateTime, Enum, func
from app.database.db import Base
from datetime import datetime
import enum


class OTPType(str, enum.Enum):
    signup = "signup"
    login = "login"
    forgot_password = "forgot_password"
    two_factor = "two_factor"


class OTPVerification(Base):
    __tablename__ = "otp_verifications"
    otp_verification_id = Column(Integer, primary_key=True, autoincrement=True)
    otp_code_hash = Column(String(300), nullable=False)
    otp_type = Column(Enum(OTPType), nullable=False)
    verification_target = Column(String(300), nullable=False)  # email/phone
    is_used = Column(Boolean, default=False, nullable=False)
    expires_at = Column(DateTime(timezone=True), nullable=False)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)
    attempts = Column(Integer, default=0, nullable=False)
