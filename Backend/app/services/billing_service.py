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
                "plan_name": "Free Plan",
                "status": "Active",
                "billing_cycle": "Monthly",
                "auto_renew": "false",
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
            
        sub.plan_name = data.plan_name
        sub.billing_cycle = data.billing_cycle
        sub.status = "Active"
        sub.payment_status = "Paid"
        sub.auto_renew = "true"
        now = datetime.now()
        sub.start_date = now.strftime("%Y-%m-%d")
        sub.end_date = (now + timedelta(days=30)).strftime("%Y-%m-%d")
        sub.updated_at = now.strftime("%Y-%m-%d %H:%M:%S")
        
        db.commit()
        db.refresh(sub)
        return sub
