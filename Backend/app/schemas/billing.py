from pydantic import BaseModel
from typing import Optional

class SubscribeRequest(BaseModel):
    plan_name: str
    billing_cycle: str = "Monthly"

class BillingResponse(BaseModel):
    subscription_id: int
    user_id: int
    plan_name: Optional[str]
    status: Optional[str]
    billing_cycle: Optional[str]
    auto_renew: Optional[str]
    start_date: Optional[str]
    end_date: Optional[str]
    payment_status: Optional[str]

    class Config:
        from_attributes = True
