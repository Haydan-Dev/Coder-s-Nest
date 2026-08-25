from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database.deps import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.schemas.billing import SubscribeRequest, BillingResponse
from app.services.billing_service import BillingService

router = APIRouter(
    prefix="/billing",
    tags=["Billing"]
)

@router.get("/my-plan", response_model=BillingResponse)
def get_my_plan(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return BillingService.get_user_subscription(current_user.user_id, db)

@router.post("/subscribe", response_model=BillingResponse)
def subscribe(data: SubscribeRequest, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return BillingService.subscribe(current_user.user_id, data, db)
