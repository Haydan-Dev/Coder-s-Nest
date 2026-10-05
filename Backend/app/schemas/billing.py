from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class SubscribeRequest(BaseModel):
    plan_name: str
    billing_cycle: str = "Monthly"

class BillingResponse(BaseModel):
    subscription_id: int
    user_id: int
    plan_name: Optional[str] = None
    status: Optional[str] = None
    billing_cycle: Optional[str] = None
    auto_renew: Optional[bool] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    payment_status: Optional[str] = None

    class Config:
        from_attributes = True
