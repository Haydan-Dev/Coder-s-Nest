from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class PlanBase(BaseModel):
    name: str
    monthly_price: float
    yearly_price: float
    max_projects: int = 2
    ram_limit_mb: int = 512
    ai_credits_per_month: int = 100
    max_collaborators: int = 2
    is_active: bool = True

class PlanCreate(PlanBase):
    pass

class PlanUpdate(BaseModel):
    name: Optional[str] = None
    monthly_price: Optional[float] = None
    yearly_price: Optional[float] = None
    max_projects: Optional[int] = None
    ram_limit_mb: Optional[int] = None
    ai_credits_per_month: Optional[int] = None
    max_collaborators: Optional[int] = None
    is_active: Optional[bool] = None

class PlanResponse(PlanBase):
    plan_id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
