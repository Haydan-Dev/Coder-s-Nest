from fastapi import HTTPException, BackgroundTasks
from sqlalchemy.orm import Session

from app.models.user import User
from app.models.otp_verification import OTPType
from app.services.otp_service import OTPService
from app.utils.email_service import send_otp_email

class AuthServiceTwoFactor:
    
    @staticmethod
    def request_enable_2fa(user_id: int, background_tasks: BackgroundTasks, db: Session):
        user = db.query(User).filter(User.user_id == user_id).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
            
        if user.two_factor_enabled:
            raise HTTPException(status_code=400, detail="2FA is already enabled")
            
        # 1. Enforce rate limits
        next_cooldown, remaining_resends = OTPService.check_otp_rate_limits(user.email, OTPType.two_factor, db)
        
        # 2. Create OTP
        otp = OTPService.create_two_factor_otp(user.email, db)
        
        # 3. Send email
        background_tasks.add_task(send_otp_email, user.email, otp)
        print(f"=====================================")
        print(f"ENABLE 2FA OTP for {user.email}: {otp}")
        print(f"=====================================")
        
        return {
            "message": "OTP sent. Please verify to enable 2FA.",
            "next_cooldown": next_cooldown,
            "remaining_resends": remaining_resends
        }

    @staticmethod
    def verify_enable_2fa(user_id: int, otp_code: str, db: Session):
        user = db.query(User).filter(User.user_id == user_id).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
            
        # Verify OTP
        OTPService.verify_two_factor_otp(user.email, otp_code, db)
        
        # Enable 2FA
        user.two_factor_enabled = True
        try:
            db.commit()
        except Exception:
            db.rollback()
            raise HTTPException(status_code=500, detail="Failed to enable 2FA")
            
        return {"message": "Two-Factor Authentication successfully enabled."}

    @staticmethod
    def disable_2fa(user_id: int, db: Session):
        user = db.query(User).filter(User.user_id == user_id).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
            
        user.two_factor_enabled = False
        try:
            db.commit()
        except Exception:
            db.rollback()
            raise HTTPException(status_code=500, detail="Failed to disable 2FA")
            
        return {"message": "Two-Factor Authentication disabled."}
