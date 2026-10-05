from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime
from datetime import datetime, timezone
from app.database.db import Base

class Plan(Base):
    __tablename__ = "plans"

    plan_id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, index=True, nullable=False)
    monthly_price = Column(Float, nullable=False, default=0)
    yearly_price = Column(Float, nullable=False, default=0)
    max_projects = Column(Integer, nullable=False, default=2)
    ram_limit_mb = Column(Integer, nullable=False, default=512)
    storage_limit_mb = Column(Integer, nullable=False, default=500)
    ai_credits_per_month = Column(Integer, nullable=False, default=100)
    max_collaborators = Column(Integer, nullable=False, default=2)
    is_active = Column(Boolean, default=True)
    
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
