from sqlalchemy.orm import Session
from sqlalchemy import func
from fastapi import HTTPException
from datetime import datetime, timezone, timedelta

from app.models.otp_verification import OTPVerification, OTPType
from app.models.user import User

from app.utils.otp_generator import generate_otp
from app.utils.otp_hasher import hash_otp, verify_otp
from app.utils.otp_time import get_otp_expiry,ensure_utc

class OTPService:

    # =========================
    # 1. GENERATE OTP (SIGNUP)
    # =========================
    @staticmethod
    def create_signup_otp(email: str, db: Session):

        otp = generate_otp()
        otp_hash = hash_otp(otp)
        expiry = get_otp_expiry()

        otp_entry = OTPVerification(
            otp_code_hash=otp_hash,
            otp_type=OTPType.signup,
            verification_target=email,
            expires_at=expiry,
            is_used=False
        )

        try:
            db.add(otp_entry)
        except Exception:
            raise HTTPException(status_code=500, detail="Failed to create OTP")

        return otp  # send via email service later


    @staticmethod
    def get_block_remaining_time(email: str, db: Session, otp_type: OTPType = OTPType.signup) -> float:
        """
        Checks if the email is blocked for 24 hours due to too many invalid verification attempts.
        Returns the remaining seconds of the block, or 0 if not blocked.
        """
        twenty_four_hours_ago = datetime.utcnow() - timedelta(hours=24)
        
        # 1. Check if any OTP in the last 24 hours has >= 5 attempts
        any_failed_otp = (
            db.query(OTPVerification)
            .filter(
                OTPVerification.verification_target == email,
                OTPVerification.otp_type == otp_type,
                OTPVerification.created_at >= twenty_four_hours_ago,
                OTPVerification.attempts >= 5
            )
            .order_by(OTPVerification.created_at.desc())
            .first()
        )
        
        # 2. Or check if the sum of all attempts in the last 24 hours is >= 5
        total_attempts = db.query(func.sum(OTPVerification.attempts)).filter(
            OTPVerification.verification_target == email,
            OTPVerification.otp_type == otp_type,
            OTPVerification.created_at >= twenty_four_hours_ago
        ).scalar() or 0
        
        if any_failed_otp:
            release_time = ensure_utc(any_failed_otp.created_at) + timedelta(hours=24)
            remaining = (release_time - datetime.now(timezone.utc)).total_seconds()
            if remaining > 0:
                return remaining
                
        if total_attempts >= 5:
            latest_with_attempts = (
                db.query(OTPVerification)
                .filter(
                    OTPVerification.verification_target == email,
                    OTPVerification.otp_type == otp_type,
                    OTPVerification.created_at >= twenty_four_hours_ago,
                    OTPVerification.attempts > 0
                )
                .order_by(OTPVerification.created_at.desc())
                .first()
            )
            if latest_with_attempts:
                release_time = ensure_utc(latest_with_attempts.created_at) + timedelta(hours=24)
                remaining = (release_time - datetime.now(timezone.utc)).total_seconds()
                if remaining > 0:
                    return remaining
                    
        return 0

    # =========================
    # 2. VERIFY OTP (SIGNUP)
    # =========================
    @staticmethod
    def verify_signup_otp(email: str, otp_code: str, db: Session):

        # Check rolling 24-hour block
        remaining_block = OTPService.get_block_remaining_time(email, db)
        if remaining_block > 0:
            hours = int(remaining_block // 3600)
            minutes = int((remaining_block % 3600) // 60)
            raise HTTPException(
                status_code=429,
                detail=f"This email is temporarily blocked due to too many invalid attempts. Try again in {hours}h {minutes}m."
            )

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
        if ensure_utc(otp_record.expires_at) < datetime.now(timezone.utc):
            raise HTTPException(status_code=400, detail="OTP expired")

        # already used check
        if otp_record.is_used:
            raise HTTPException(status_code=400, detail="OTP already used")

        # verify hash
        if not verify_otp(otp_code, otp_record.otp_code_hash):
            otp_record.attempts += 1
            try:
                db.commit()
            except Exception:
                db.rollback()

            if otp_record.attempts >= 5:
                otp_record.is_used = True
                try:
                    db.commit()
                except Exception:
                    db.rollback()
                raise HTTPException(
                    status_code=400,
                    detail="Too many invalid attempts. This OTP has been invalidated. Please request a new code."
                )

            attempts_left = 5 - otp_record.attempts
            raise HTTPException(
                status_code=400,
                detail=f"Invalid OTP. {attempts_left} attempts remaining."
            )

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

    @staticmethod
    def check_otp_rate_limits(email: str, otp_type: OTPType, db: Session):
        # Check rolling 24-hour block
        remaining_block = OTPService.get_block_remaining_time(email, db, otp_type)
        if remaining_block > 0:
            hours = int(remaining_block // 3600)
            minutes = int((remaining_block % 3600) // 60)
            raise HTTPException(
                status_code=429,
                detail=f"Too many requests. Please try again in {hours}h {minutes}m."
            )

        # --- Control 2: Check hourly rate limit (max 5 requests/hour) ---
        one_hour_ago_naive = datetime.utcnow() - timedelta(hours=1)
        recent_otps = (
            db.query(OTPVerification)
            .filter(
                OTPVerification.verification_target == email,
                OTPVerification.otp_type == otp_type,
                OTPVerification.created_at >= one_hour_ago_naive
            )
            .order_by(OTPVerification.created_at.asc())
            .all()
        )

        recent_otps_count = len(recent_otps)

        if recent_otps_count >= 5:
            oldest_recent_otp = recent_otps[0]
            reset_time = ensure_utc(oldest_recent_otp.created_at) + timedelta(hours=1)
            time_to_reset = reset_time - datetime.now(timezone.utc)
            minutes_remaining = max(1, int(time_to_reset.total_seconds() / 60))
            raise HTTPException(
                status_code=429,
                detail=f"Hourly OTP limit reached. Please try again in {minutes_remaining} minutes."
            )

        # --- Control 1: Check dynamic cooldowns ---
        COOLDOWNS = [30, 45, 60, 75, 100, 115, 120]
        if recent_otps_count > 0:
            cooldown_idx = min(recent_otps_count - 1, len(COOLDOWNS) - 1)
            current_cooldown = COOLDOWNS[cooldown_idx]
            latest_otp = recent_otps[-1]
            time_elapsed = datetime.now(timezone.utc) - ensure_utc(latest_otp.created_at)
            if time_elapsed.total_seconds() < current_cooldown:
                cooldown_remaining = int(current_cooldown - time_elapsed.total_seconds())
                raise HTTPException(
                    status_code=429,
                    detail=f"Please wait {cooldown_remaining} seconds before requesting a new OTP."
                )

        next_cooldown = COOLDOWNS[min(recent_otps_count, len(COOLDOWNS) - 1)]
        remaining_resends = max(0, 4 - recent_otps_count)

        return next_cooldown, remaining_resends


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

        next_cooldown, remaining_resends = OTPService.check_otp_rate_limits(email, OTPType.signup, db)

        # Create new OTP
        otp = OTPService.create_signup_otp(email, db)

        try:
            db.commit()
        except Exception:
            db.rollback()
            raise HTTPException(status_code=500, detail="Failed to save resend OTP")

        return otp, next_cooldown, remaining_resends

    # =========================
    # 4. FORGOT PASSWORD OTP
    # =========================
    @staticmethod
    def create_forgot_password_otp(email: str, db: Session):
        otp = generate_otp()
        otp_hash = hash_otp(otp)
        expiry = get_otp_expiry()

        otp_entry = OTPVerification(
            otp_code_hash=otp_hash,
            otp_type=OTPType.forgot_password,
            verification_target=email,
            expires_at=expiry,
            is_used=False
        )

        try:
            db.add(otp_entry)
            db.commit()
        except Exception:
            db.rollback()
            raise HTTPException(status_code=500, detail="Failed to create OTP")

        return otp

    @staticmethod
    def verify_forgot_password_otp(email: str, otp_code: str, db: Session):
        # Check rolling 24-hour block
        remaining_block = OTPService.get_block_remaining_time(email, db, OTPType.forgot_password)
        if remaining_block > 0:
            hours = int(remaining_block // 3600)
            minutes = int((remaining_block % 3600) // 60)
            raise HTTPException(
                status_code=429,
                detail=f"This email is temporarily blocked due to too many invalid attempts. Try again in {hours}h {minutes}m."
            )

        # fetch latest OTP
        otp_record = (
            db.query(OTPVerification)
            .filter(
                OTPVerification.verification_target == email,
                OTPVerification.is_used == False,
                OTPVerification.otp_type == OTPType.forgot_password
            )
            .order_by(OTPVerification.created_at.desc())
            .first()
        )

        if not otp_record:
            raise HTTPException(status_code=400, detail="OTP not found or already used")

        # expiry check
        if ensure_utc(otp_record.expires_at) < datetime.now(timezone.utc):
            raise HTTPException(status_code=400, detail="OTP expired")

        # verify hash
        if not verify_otp(otp_code, otp_record.otp_code_hash):
            otp_record.attempts += 1
            try:
                db.commit()
            except Exception:
                db.rollback()

            if otp_record.attempts >= 5:
                otp_record.is_used = True
                try:
                    db.commit()
                except Exception:
                    db.rollback()
                raise HTTPException(
                    status_code=400,
                    detail="Too many invalid attempts. This OTP has been invalidated. Please request a new code."
                )

            attempts_left = 5 - otp_record.attempts
            raise HTTPException(
                status_code=400,
                detail=f"Invalid OTP. {attempts_left} attempts remaining."
            )

        # mark OTP used
        otp_record.is_used = True
        try:
            db.commit()
        except Exception:
            db.rollback()
            raise HTTPException(status_code=500, detail="DB update failed")

        return True

    # =========================
    # 5. TWO-FACTOR OTP
    # =========================
    @staticmethod
    def create_two_factor_otp(email: str, db: Session):
        otp = generate_otp()
        otp_hash = hash_otp(otp)
        expiry = get_otp_expiry()

        otp_entry = OTPVerification(
            otp_code_hash=otp_hash,
            otp_type=OTPType.two_factor,
            verification_target=email,
            expires_at=expiry,
            is_used=False
        )

        try:
            db.add(otp_entry)
            db.commit()
        except Exception:
            db.rollback()
            raise HTTPException(status_code=500, detail="Failed to create 2FA OTP")

        return otp

    @staticmethod
    def verify_two_factor_otp(email: str, otp_code: str, db: Session):
        # Check rolling 24-hour block
        remaining_block = OTPService.get_block_remaining_time(email, db, OTPType.two_factor)
        if remaining_block > 0:
            hours = int(remaining_block // 3600)
            minutes = int((remaining_block % 3600) // 60)
            raise HTTPException(
                status_code=429,
                detail=f"This email is temporarily blocked due to too many invalid attempts. Try again in {hours}h {minutes}m."
            )

        # fetch latest OTP
        otp_record = (
            db.query(OTPVerification)
            .filter(
                OTPVerification.verification_target == email,
                OTPVerification.is_used == False,
                OTPVerification.otp_type == OTPType.two_factor
            )
            .order_by(OTPVerification.created_at.desc())
            .first()
        )

        if not otp_record:
            raise HTTPException(status_code=400, detail="OTP not found or already used")

        # expiry check
        if ensure_utc(otp_record.expires_at) < datetime.now(timezone.utc):
            raise HTTPException(status_code=400, detail="OTP expired")

        # verify hash
        if not verify_otp(otp_code, otp_record.otp_code_hash):
            otp_record.attempts += 1
            try:
                db.commit()
            except Exception:
                db.rollback()

            if otp_record.attempts >= 5:
                otp_record.is_used = True
                try:
                    db.commit()
                except Exception:
                    db.rollback()
                raise HTTPException(
                    status_code=400,
                    detail="Too many invalid attempts. This OTP has been invalidated. Please request a new code."
                )

            attempts_left = 5 - otp_record.attempts
            raise HTTPException(
                status_code=400,
                detail=f"Invalid OTP. {attempts_left} attempts remaining."
            )

        # mark OTP used
        otp_record.is_used = True
        try:
            db.commit()
        except Exception:
            db.rollback()
            raise HTTPException(status_code=500, detail="DB update failed")

        return True