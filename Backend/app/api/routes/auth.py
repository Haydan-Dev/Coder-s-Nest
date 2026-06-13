from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.schemas.auth import SignupSchema
from app.database.deps import get_db
from app.services.auth_service import AuthService
from app.schemas.otp import OTPVerifyRequest, OTPResendRequest
from app.services.otp_service import OTPService
from app.utils.email_service import send_otp_email

router = APIRouter(
    prefix="/auth",
    tags=["Auth"]
)


@router.post("/signup")
async def signup(user: SignupSchema, db: Session = Depends(get_db)):
    return await AuthService.signup(user, db,)
    
@router.post("/verify-otp")
def verify_otp(payload: OTPVerifyRequest, db: Session = Depends(get_db)):
    return AuthService.verify_and_login(payload.email, payload.otp_code, db)

@router.post("/resend-otp")
def resend_otp(payload: OTPResendRequest, db: Session = Depends(get_db)):
    otp, next_cooldown = OTPService.resend_signup_otp(payload.email, db)
    # Send the real email
    send_otp_email(payload.email, otp)
    return {
        "message": "OTP resent successfully.",
        "next_cooldown": next_cooldown
    }
