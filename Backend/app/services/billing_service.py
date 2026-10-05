from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from app.models.billing_system import BillingSystem
from app.schemas.billing import SubscribeRequest
from fastapi import HTTPException

class BillingService:
    @staticmethod
    def get_user_subscription(user_id: int, db: Session):
        sub = db.query(BillingSystem).filter(BillingSystem.user_id == user_id).first()
        if not sub:
            # Return a default Free plan if no record exists
            return {
                "subscription_id": 0,
                "user_id": user_id,
                "plan_name": "Free",
                "status": "Active",
                "billing_cycle": "Monthly",
                "auto_renew": False,
                "start_date": None,
                "end_date": None,
                "payment_status": "Paid"
            }
        return sub

    @staticmethod
    def subscribe(user_id: int, data: SubscribeRequest, db: Session):
        sub = db.query(BillingSystem).filter(BillingSystem.user_id == user_id).first()
        if not sub:
            sub = BillingSystem(user_id=user_id)
            db.add(sub)
            
        from app.models.plan import Plan
        plan = db.query(Plan).filter(Plan.name == data.plan_name).first()
        if not plan:
            raise HTTPException(status_code=400, detail="Plan Not Found")
            
        sub.plan_id = plan.plan_id
        sub.billing_cycle = data.billing_cycle
        sub.status = "Active"
        sub.payment_status = "Paid"
        sub.auto_renew = True
        now = datetime.now()
        sub.start_date = now
        sub.end_date = now + timedelta(days=30)
        sub.created_at = sub.created_at or now
        sub.updated_at = now
        
        db.commit()
        db.refresh(sub)
        return sub
