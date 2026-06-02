from datetime import datetime, timedelta, timezone
import jwt

from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.models.user import User
from app.models.user_session import UserSession  # we will use later

from app.utils.password_hashed import verify_password

# =========================
# CONFIG (temporary here)
# =========================
SECRET_KEY = "your-secret-key-change-this"
ALGORITHM = "HS256"

ACCESS_TOKEN_EXPIRE_MINUTES = 30
REFRESH_TOKEN_EXPIRE_DAYS = 7


class AuthServiceLogin:

    @staticmethod
    def login(email: str, password: str, db: Session):

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

        # 4. CREATE TOKENS
        access_token = AuthServiceLogin.create_access_token(user.user_id)
        refresh_token = AuthServiceLogin.create_refresh_token(user.user_id)

        # 5. STORE SESSION IN DB (important for SaaS)
        session = UserSession(
            user_id=user.user_id,
            refresh_token_hash=refresh_token,  # later we will hash this
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

        # 6. RETURN TOKENS
        return {
            "access_token": access_token,
            "refresh_token": refresh_token,
            "token_type": "bearer",
            "user_id": user.user_id
        }

    # =========================
    # ACCESS TOKEN
    # =========================
    @staticmethod
    def create_access_token(user_id: int):

        payload = {
            "user_id": user_id,
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
            "user_id": user_id,
            "type": "refresh",
            "exp": datetime.now(timezone.utc) + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
        }

        return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)