from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Text, func
from app.database.db import Base


class UserSession(Base):
    __tablename__ = "user_sessions"

    session_id = Column(Integer, primary_key=True, autoincrement=True)

    user_id = Column(Integer, ForeignKey("users.user_id"), nullable=False)

    # 🔐 token tracking (IMPORTANT)
    refresh_token_hash = Column(String(500), nullable=False)

    # 📱 device info (SaaS feature)
    device_type = Column(String(50), nullable=False)   # Mobile / Desktop / Web
    device_name = Column(String(150), nullable=True)
    device_os = Column(String(100), nullable=True)
    browser_name = Column(String(100), nullable=True)

    # 🌐 security tracking
    ip_address = Column(String(100), nullable=False)
    location = Column(String(150), nullable=True)

    # ⚡ session state
    is_active = Column(Boolean, default=True, nullable=False)

    # ⏱ lifecycle
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    last_active_at = Column(DateTime(timezone=True), server_default=func.now())
    expires_at = Column(DateTime(timezone=True), nullable=False)

    revoked_at = Column(DateTime(timezone=True), nullable=True)