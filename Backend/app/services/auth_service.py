from fastapi import HTTPException, BackgroundTasks
from sqlalchemy.orm import Session

from app.models.user import User
from app.utils.password_hashed import hash_password
from app.utils.password_validator import validate_password_strength
from app.utils.phone_number_validator import validate_phone_number
from app.utils.email_service import send_otp_email

from app.services.otp_service import OTPService



class AuthService:

    @staticmethod
    async def signup(user, background_tasks: BackgroundTasks, db: Session):
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
            db.flush()
        # 7. OTP GENERATE
            otp = OTPService.create_signup_otp(user.email, db)
            db.commit()
            db.refresh(new_user)
        except Exception as e:
            db.rollback()
            print("DB ERROR:", repr(e))
            raise HTTPException(
            status_code=500,
            detail=f"Failed to register user. Please try again: {str(e)}"
            )
        # 8. SEND REAL VERIFICATION EMAIL
        background_tasks.add_task(send_otp_email, user.email, otp)


        return {
            "message": "User created. OTP sent to email.",
            "user_id": new_user.user_id,
            "next_cooldown": 30,
            "remaining_resends": 4
        }

    @staticmethod
    def verify_and_login(email: str, otp_code: str, db: Session):
        # Import dynamically or locally if needed to avoid circular import issues
        from app.services.auth_service_login import AuthServiceLogin
        
        # 1. Call the OTP service to verify the code
        verification = OTPService.verify_signup_otp(email, otp_code, db)
        
        # 2. Call the Login service to generate tokens
        session_data = AuthServiceLogin.generate_user_session(verification["user_id"], db)
        
        # 3. Return the consolidated result
        return {
            "message": "Verification successful.",
            "session": session_data
        }
