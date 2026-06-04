# model banane ke liye table banana padega and table banane ke liye ye imports karne padenge
# database se db import kiya hai crud ke liye db as base
from sqlalchemy import (
    Column,
    Integer,
    String,
    Boolean,
    DateTime,
    Text,
    func,
    Enum
)

from app.database.db import Base
import enum

class PlatformRole(str, enum.Enum):
    MEMBER = "Member"
    GUEST = "Guest"
    PROJECT_OWNER = "Project_Owner"
    PROJECT_LEADER = "Project_leader"


class User(Base):
    __tablename__ = "users"

    user_id = Column(Integer, primary_key=True, autoincrement=True)
    full_name = Column(String(100), nullable=False)
    email = Column(String(100), unique=True, nullable=False, index=True)
    phone_number = Column(String(20), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)

    profile_pic_url = Column(String(500), nullable=True)
    bio = Column(Text, nullable=True)
    platform_role = Column(
    Enum(
        PlatformRole,
        values_callable=lambda obj: [e.value for e in obj]
    ),
    default=PlatformRole.MEMBER,
    nullable=False
    )

    is_email_verified = Column(Boolean, default=False, nullable=False)
    is_phone_verified = Column(Boolean, default=False, nullable=False)
    two_factor_enabled = Column(Boolean, default=False, nullable=False)

    last_seen_at = Column(DateTime(timezone=True), server_default=func.now())
    last_login_at = Column(DateTime(timezone=True), nullable=True)

    is_deleted = Column(Boolean, default=False, nullable=False)
    deleted_at = Column(DateTime(timezone=True), nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False
    )