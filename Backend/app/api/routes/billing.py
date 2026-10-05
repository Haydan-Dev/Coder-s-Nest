from sys import prefix
from app.api.routes import auth
import os 
import razorpay
from fastapi import APIRouter, Depends,HTTPException
from sqlalchemy.orm import Session
from app.database.deps import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.models.plan import Plan
from app.models.billing_system import BillingSystem
from app.schemas.billing import SubscribeRequest, BillingResponse
from app.services.billing_service import BillingService

# Razorpay Setup (hum .env se tumhari daali hui keys utha rahe hain)
from dotenv import load_dotenv
load_dotenv()

RAZORPAY_KEY_ID = os.getenv("key_id")
RAZORPAY_KEY_SECRET = os.getenv("key_secret")

client = razorpay.Client(auth=(RAZORPAY_KEY_ID,RAZORPAY_KEY_SECRET))

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


@router.post("/create-order")
def create_order(plan_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    # 1. Database se plan nikalenge
    plan = db.query(Plan).filter(Plan.plan_id == plan_id).first()
    if not plan:
        raise HTTPException(status_code=404, detail="Plan Not Found")

    # 2. Razorpay hamesha paise (cents/paise) mein amount leta hai, isliye 100 se multiply kiya
    amount_in_paise = int(plan.monthly_price * 100)
    
    if amount_in_paise <= 0:
        raise HTTPException(status_code=400, detail="There is no need for payment to get a free plan!")

    # 3. Razorpay pe order banwayenge
    # Note: Agar INR mein payment chahiye toh "USD" ki jagah "INR" kar dena
    data = {"amount": amount_in_paise, "currency": "INR", "payment_capture": 1}
    order = client.order.create(data=data)
    
    # 4. Frontend ko data return karenge
    return {
        "order_id": order["id"], 
        "amount": order["amount"], 
        "currency": order["currency"],
        "plan_name": plan.name,
        "key_id": RAZORPAY_KEY_ID
    }

@router.post("/verify-payment")
def verify_payment(razorpay_order_id: str, razorpay_payment_id: str, razorpay_signature: str, plan_name: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    try:
        # 1. Razorpay SDK se hum pehle check karenge ki payment hack toh nahi hui
        params_dict = {
            'razorpay_order_id': razorpay_order_id,
            'razorpay_payment_id': razorpay_payment_id,
            'razorpay_signature': razorpay_signature
        }
        client.utility.verify_payment_signature(params_dict)
        
        # 2. Database update: Plan ko 'Active' mark karke record save karna
        sub_req = SubscribeRequest(plan_name=plan_name, billing_cycle="Monthly")
        BillingService.subscribe(current_user.user_id, sub_req, db)
        
        return {"status": "success", "message": "The Payment is Genuine and Valid! your plan has been activated now."}
        
    except razorpay.errors.SignatureVerificationError:
        raise HTTPException(status_code=400, detail="Fake Payment Attemp!")