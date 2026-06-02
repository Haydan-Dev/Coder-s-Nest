from sqlalchemy.orm import Session
from fastapi import HTTPException
from datetime import datetime, timezone

from app.models.otp_verification import OTPVerification, OTPType
from app.models.user import User

from app.utils.otp_generator import generate_otp
from app.utils.otp_hasher import hash_otp, verify_otp
from app.utils.otp_time import get_otp_expiry


class OTPService:

    # =========================
    # 1. GENERATE OTP (SIGNUP)
    # =========================
    @staticmethod
    def create_signup_otp(email: str, db: Session):

        otp = generate_otp()
        otp_hash = hash_otp(otp)
        expiry = get_otp_expiry(10)

        otp_entry = OTPVerification(
            otp_code_hash=otp_hash,
            otp_type=OTPType.signup,
            verification_target=email,
            expires_at=expiry,
            is_used=False
        )

        try:
            db.add(otp_entry)
            db.commit()
            db.refresh(otp_entry)
        except Exception:
            db.rollback()
            raise HTTPException(status_code=500, detail="Failed to create OTP")

        return otp  # send via email service later


    # =========================
    # 2. VERIFY OTP (SIGNUP)
    # =========================
    @staticmethod
    def verify_signup_otp(email: str, otp_code: str, db: Session):

        # fetch latest OTP
        otp_record = (
            db.query(OTPVerification)
            .filter(
                OTPVerification.verification_target == email,
                OTPVerification.is_used == False,
                OTPVerification.otp_type == OTPType.signup
            )
            .order_by(OTPVerification.created_at.desc())
            .first()
        )

        if not otp_record:
            raise HTTPException(status_code=400, detail="OTP not found")

        # expiry check
        if otp_record.expires_at < datetime.now(timezone.utc):
            raise HTTPException(status_code=400, detail="OTP expired")

        # already used check
        if otp_record.is_used:
            raise HTTPException(status_code=400, detail="OTP already used")

        # verify hash
        if not verify_otp(otp_code, otp_record.otp_code_hash):
            raise HTTPException(status_code=400, detail="Invalid OTP")

        # mark OTP used
        otp_record.is_used = True

        # activate user
        user = db.query(User).filter(User.email == email).first()

        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        user.is_email_verified = True

        try:
            db.commit()
            db.refresh(user)
        except Exception:
            db.rollback()
            raise HTTPException(status_code=500, detail="DB update failed")

        return {
            "message": "OTP verified successfully",
            "user_id": user.user_id
        }


    # =========================
    # 3. RESEND OTP
    # =========================
    @staticmethod
    def resend_signup_otp(email: str, db: Session):

        user = db.query(User).filter(User.email == email).first()

        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        if user.is_email_verified:
            raise HTTPException(status_code=400, detail="User already verified")

        return OTPService.create_signup_otp(email, db)