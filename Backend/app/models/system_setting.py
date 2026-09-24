from sqlalchemy import Column, String, JSON, DateTime
from sqlalchemy.sql import func
from app.database.db import Base

class SystemSetting(Base):
    __tablename__ = "system_settings"

    setting_key = Column(String(100), primary_key=True)
    setting_value = Column(JSON, nullable=True)
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now(), nullable=False)
