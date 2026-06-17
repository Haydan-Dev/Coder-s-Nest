from datetime import datetime, timedelta, timezone
from jose import jwt, JWTError
from fastapi import HTTPException, BackgroundTasks, status
from sqlalchemy.orm import Session

from app.models.otp_verification import OTPType
from app.services.otp_service import OTPService
from app.utils.email_service import send_otp_email

from app.models.user import User
from app.models.user_session import UserSession  # we will use later

from app.utils.password_hashed import verify_password, hash_password
from app.core.config import SECRET_KEY,ALGORITHM,ACCESS_TOKEN_EXPIRE_MINUTES,REFRESH_TOKEN_EXPIRE_DAYS

class AuthServiceLogin:
    
    @staticmethod
    def generate_user_session(user_id: int, db: Session):
        # 1. CREATE TOKENS
        access_token = AuthServiceLogin.create_access_token(user_id)
        refresh_token = AuthServiceLogin.create_refresh_token(user_id)

        # 2. STORE SESSION IN DB
        session = UserSession(
            user_id=user_id,
            refresh_token_hash=hash_password(refresh_token),
            device_type="Web",
            device_name="Unknown",
            device_os="Unknown",
            browser_name="Unknown",
            ip_address="0.0.0.0",
            is_active=True,
            last_active_at=datetime.now(timezone.utc),
            expires_at=datetime.now(timezone.utc) + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS),
        )

        db.add(session)
        db.commit()
        db.refresh(session)

        # 3. RETURN TOKENS
        return {
            "access_token": access_token,
            "refresh_token": refresh_token,
            "token_type": "bearer",
            "user_id": user_id
        }


    @staticmethod
    def login(email: str, password: str, background_tasks: BackgroundTasks, db: Session):

        # 1. CHECK USER EXISTS
        user = db.query(User).filter(User.email == email).first()

        if not user:
            raise HTTPException(status_code=400, detail="Invalid credentials")

        # 2. CHECK PASSWORD
        if not verify_password(password, user.password_hash):
            raise HTTPException(status_code=400, detail="Invalid credentials")

        # 3. EMAIL VERIFICATION CHECK
        if not user.is_email_verified:
            raise HTTPException(status_code=400, detail="Email not verified")

        # 4. 2FA CHECK
        if user.two_factor_enabled:
            # Enforce rate limits
            OTPService.check_otp_rate_limits(user.email, OTPType.two_factor, db)
            # Create OTP
            otp = OTPService.create_two_factor_otp(user.email, db)
            # Send email
            background_tasks.add_task(send_otp_email, user.email, otp)
            print(f"=====================================")
            print(f"2FA LOGIN OTP for {user.email}: {otp}")
            print(f"=====================================")
            
            # Generate temp_token
            expire = datetime.now(timezone.utc) + timedelta(minutes=5)
            to_encode = {"sub": str(user.user_id), "purpose": "2fa_login", "exp": expire}
            temp_token = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
            
            return {
                "message": "2FA required",
                "temp_token": temp_token
            }

        # 5. NO 2FA -> DIRECT LOGIN
        return AuthServiceLogin.generate_user_session(user.user_id, db)

    @staticmethod
    def verify_login_2fa(temp_token: str, otp_code: str, db: Session):
        try:
            payload = jwt.decode(temp_token, SECRET_KEY, algorithms=[ALGORITHM])
            user_id_str: str = payload.get("sub")
            purpose: str = payload.get("purpose")
            
            if user_id_str is None or purpose != "2fa_login":
                raise HTTPException(status_code=401, detail="Invalid 2FA token")
                
            user_id = int(user_id_str)
        except JWTError:
            raise HTTPException(status_code=401, detail="Invalid or expired 2FA token")
            
        user = db.query(User).filter(User.user_id == user_id).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
            
        # Verify OTP
        OTPService.verify_two_factor_otp(user.email, otp_code, db)
        
        # Generate full session
        return AuthServiceLogin.generate_user_session(user.user_id, db)

    @staticmethod
    def logout(refresh_token: str, db: Session):
        # We can't query by refresh_token_hash directly anymore since it's a bcrypt hash.
        # But wait, if we only have the raw refresh token, we'd have to check all sessions!
        # A better approach is to decode the refresh_token to get the user_id, 
        # then find their active sessions and verify the hash.
        try:
            payload = jwt.decode(refresh_token, SECRET_KEY, algorithms=[ALGORITHM])
            user_id_str = payload.get("sub")
            if not user_id_str:
                return {"message": "Logged out successfully"}
            user_id = int(user_id_str)
        except (JWTError, ValueError, TypeError):
            return {"message": "Logged out successfully"} # Token invalid anyway

        sessions = db.query(UserSession).filter(UserSession.user_id == user_id, UserSession.is_active == True).all()
        for session in sessions:
            if verify_password(refresh_token, session.refresh_token_hash):
                session.is_active = False
                session.revoked_at = datetime.now(timezone.utc)
                db.commit()
                break
        return {"message": "Logged out successfully"}

    @staticmethod
    def refresh_access_token(refresh_token: str, db: Session):
        try:
            payload = jwt.decode(refresh_token, SECRET_KEY, algorithms=[ALGORITHM])
            user_id_str = payload.get("sub")
            if user_id_str is None:
                raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid refresh token format")
            user_id = int(user_id_str)
        except (JWTError, ValueError, TypeError):
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired refresh token")

        sessions = db.query(UserSession).filter(UserSession.user_id == user_id, UserSession.is_active == True).all()
        active_session = None
        for session in sessions:
            if verify_password(refresh_token, session.refresh_token_hash):
                active_session = session
                break
                
        if not active_session:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Session revoked or invalid")

        # naive datetime to aware datetime if needed, or both are aware
        if active_session.expires_at.replace(tzinfo=timezone.utc) < datetime.now(timezone.utc):
            active_session.is_active = False
            db.commit()
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Session expired. Please log in again.")

        # Create new tokens (Refresh Token Rotation)
        access_token = AuthServiceLogin.create_access_token(user_id)
        new_refresh_token = AuthServiceLogin.create_refresh_token(user_id)
        
        # Update current session
        active_session.refresh_token_hash = hash_password(new_refresh_token)
        active_session.last_active_at = datetime.now(timezone.utc)
        active_session.expires_at = datetime.now(timezone.utc) + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
        db.commit()
        
        return {
            "access_token": access_token,
            "refresh_token": new_refresh_token,
            "token_type": "bearer",
            "user_id": user_id
        }

    # =========================
    # ACCESS TOKEN
    # =========================
    @staticmethod
    def create_access_token(user_id: int):

        payload = {
            "sub": str(user_id),
            "type": "access",
            "exp": datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        }

        return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)

    # =========================
    # REFRESH TOKEN
    # =========================
    @staticmethod
    def create_refresh_token(user_id: int):

        payload = {
            "sub": str(user_id),
            "type": "refresh",
            "exp": datetime.now(timezone.utc) + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
        }

        return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)