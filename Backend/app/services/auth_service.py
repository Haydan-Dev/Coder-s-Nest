from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.models.user import User
from app.utils.password_hashed import hash_password
from app.utils.password_validator import validate_password_strength
from app.utils.phone_number_validator import validate_phone_number

from app.services.otp_service import OTPService


class AuthService:

    @staticmethod
    def signup(user, db: Session):

        # 1. password validation
        try:
            validate_password_strength(user.password)
        except ValueError as e:
            raise HTTPException(status_code=400, detail=str(e))

        # 2. phone validation
        try:
            phone = validate_phone_number(user.phone_number)
        except ValueError as e:
            raise HTTPException(status_code=400, detail=str(e))

        # 3. email exists check
        if db.query(User).filter(User.email == user.email).first():
            raise HTTPException(status_code=400, detail="Email already registered")

        # 4. phone exists check
        if db.query(User).filter(User.phone_number == phone).first():
            raise HTTPException(status_code=400, detail="Phone already registered")

        # 5. hash password
        hashed = hash_password(user.password)

        # 6. create user
        new_user = User(
            full_name=user.full_name,
            email=user.email,
            phone_number=phone,
            password_hash=hashed,
            is_email_verified=False,
            is_phone_verified=False,
        )

        try:
            db.add(new_user)
            db.commit()
            db.refresh(new_user)
        except Exception as e:
            db.rollback()
            print("DB ERROR:", repr(e))
            raise HTTPException(
            status_code=500,
            detail=f"Database error: {str(e)}"
            )

        # 7. OTP GENERATE
        otp = OTPService.create_signup_otp(user.email, db)

        # 8. MOCK EMAIL SEND
        print(f"OTP for {user.email}: {otp}")

        return {
            "message": "User created. OTP sent to email.",
            "user_id": new_user.user_id
        }