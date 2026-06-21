from fastapi import HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from datetime import datetime, timedelta, timezone
from jose import jwt, JWTError

from app.models.user import User
from app.models.user_session import UserSession
from app.models.otp_verification import OTPType
from app.services.otp_service import OTPService
from app.utils.password_hashed import hash_password, verify_password
from app.schemas.auth import ForgotPasswordRequest, VerifyResetOTPRequest, ResetPasswordRequest
from app.core.config import SECRET_KEY, ALGORITHM
from app.utils.email_service import send_otp_email

class AuthServiceReset:
    @staticmethod
    def request_password_reset(request: ForgotPasswordRequest, background_tasks: BackgroundTasks, db: Session):
        user = db.query(User).filter(User.email == request.email).first()
        
        # 1. Enforce rate limits universally (prevents enumeration)
        next_cooldown, remaining_resends = OTPService.check_otp_rate_limits(request.email, OTPType.forgot_password, db)
        
        # 2. Always generate OTP universally (so limits apply evenly)
        otp = OTPService.create_forgot_password_otp(request.email, db)
        
        # Only process if user exists AND their email is verified
        if user and user.is_email_verified:
            print(f"=====================================")
            print(f"FORGOT PASSWORD OTP for {request.email}: {otp}")
            print(f"=====================================")
            
            # Send the email via background task
            background_tasks.add_task(send_otp_email, request.email, otp)
            
        # Anti-enumeration: always return the same message
        return {
            "message": "If an account with that email exists, a password reset code has been sent.",
            "next_cooldown": next_cooldown,
            "remaining_resends": remaining_resends
        }

    @staticmethod
    def verify_reset_otp(request: VerifyResetOTPRequest, db: Session):
        # 1. Verify OTP
        # OTPService will raise HTTPException if invalid/expired
        OTPService.verify_forgot_password_otp(request.email, request.otp_code, db)
        
        # 2. Get user
        user = db.query(User).filter(User.email == request.email).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
            
        # 3. Generate short-lived reset token (5 minutes)
        # Include part of current password hash to invalidate token after use
        expire = datetime.now(timezone.utc) + timedelta(minutes=5)
        to_encode = {
            "sub": str(user.user_id), 
            "purpose": "password_reset", 
            "exp": expire,
            "pwd_hash": user.password_hash[-10:]
        }
        reset_token = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
        
        return {
            "message": "OTP verified. Proceed to reset password.",
            "reset_token": reset_token
        }
        
    @staticmethod
    def reset_password(request: ResetPasswordRequest, db: Session):
        # 1. Validate confirm password
        if request.new_password != request.confirm_password:
            raise HTTPException(status_code=400, detail="Passwords do not match")
            
        # 2. Verify token
        try:
            payload = jwt.decode(request.token, SECRET_KEY, algorithms=[ALGORITHM])
            user_id_str: str = payload.get("sub")
            purpose: str = payload.get("purpose")
            token_pwd_hash: str = payload.get("pwd_hash")
            
            if user_id_str is None or purpose != "password_reset":
                raise HTTPException(status_code=401, detail="Invalid reset token")
                
            user_id = int(user_id_str)
        except JWTError:
            raise HTTPException(status_code=401, detail="Invalid or expired reset token")
            
        # 3. Get user
        user = db.query(User).filter(User.user_id == user_id).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
            
        # Verify token hasn't been used (password hasn't changed since token was issued)
        if token_pwd_hash and token_pwd_hash != user.password_hash[-10:]:
            raise HTTPException(status_code=401, detail="Reset token has already been used")
            
        # 4. Password Reuse Prevention
        if verify_password(request.new_password, user.password_hash):
            raise HTTPException(status_code=400, detail="New password must be different from your old password.")
            
        # 5. Update password
        user.password_hash = hash_password(request.new_password)
        
        # 6. CRITICAL SECURITY: Invalidate all existing active sessions
        db.query(UserSession).filter(UserSession.user_id == user_id, UserSession.is_active == True).update({"is_active": False})
        
        try:
            db.commit()
        except Exception:
            db.rollback()
            raise HTTPException(status_code=500, detail="Failed to update password")
            
        return {"message": "Password successfully updated. You can now log in."}
