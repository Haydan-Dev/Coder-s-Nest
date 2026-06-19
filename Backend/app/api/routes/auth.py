from fastapi import APIRouter, Depends, BackgroundTasks, Response, Cookie, HTTPException, status
from sqlalchemy.orm import Session

from app.schemas.auth import SignupSchema, LoginSchema, LogoutRequest, ForgotPasswordRequest, VerifyResetOTPRequest, ResetPasswordRequest, VerifyTwoFactorRequest
from app.database.deps import get_db
from app.services.auth_service import AuthService
from app.services.auth_service_login import AuthServiceLogin
from app.services.auth_service_reset import AuthServiceReset
from app.services.auth_service_2fa import AuthServiceTwoFactor
from app.schemas.otp import OTPVerifyRequest, OTPResendRequest
from app.services.otp_service import OTPService
from app.utils.email_service import send_otp_email
from app.api.deps import get_current_user
from app.models.user import User
from app.core.config import IS_PRODUCTION
from fastapi import HTTPException, status
from app.api.deps import get_current_user
from app.models.user import User

router = APIRouter(
    prefix="/auth",
    tags=["Auth"]
)


@router.post("/signup")
async def signup(user: SignupSchema, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    return await AuthService.signup(user, background_tasks, db)
    
@router.post("/verify-otp")
def verify_otp(payload: OTPVerifyRequest, response: Response, db: Session = Depends(get_db)):
    res_data = AuthService.verify_and_login(payload.email, payload.otp_code, db)
    if "session" in res_data:
        response.set_cookie(
            key="refresh_token",
            value=res_data["session"]["refresh_token"],
            httponly=True,
            secure=IS_PRODUCTION,
            samesite="lax",
            path="/",
            max_age=14 * 24 * 60 * 60
        )
        del res_data["session"]["refresh_token"]
    return res_data

@router.post("/resend-otp")
def resend_otp(payload: OTPResendRequest, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    otp, next_cooldown, remaining_resends = OTPService.resend_signup_otp(payload.email, db)
    # Send the real email in the background
    background_tasks.add_task(send_otp_email, payload.email, otp)
    return {
        "message": "OTP resent successfully.",
        "next_cooldown": next_cooldown,
        "remaining_resends": remaining_resends
    }

@router.post("/login")
def login(payload: LoginSchema, response: Response, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    res_data = AuthServiceLogin.login(payload.email, payload.password, background_tasks, db)
    if "temp_token" not in res_data:
        response.set_cookie(
            key="refresh_token",
            value=res_data["refresh_token"],
            httponly=True,
            secure=IS_PRODUCTION,
            samesite="lax",
            path="/",
            max_age=14 * 24 * 60 * 60
        )
        del res_data["refresh_token"]
    return res_data

@router.post("/logout")
def logout(response: Response, refresh_token: str = Cookie(None), db: Session = Depends(get_db)):
    if refresh_token:
        AuthServiceLogin.logout(refresh_token, db)
    response.delete_cookie("refresh_token", path="/")
    return {"message": "Logged out successfully"}

@router.post("/forgot-password")
def forgot_password(payload: ForgotPasswordRequest, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    return AuthServiceReset.request_password_reset(payload, background_tasks, db)

@router.post("/verify-reset-otp")
def verify_reset_otp(payload: VerifyResetOTPRequest, db: Session = Depends(get_db)):
    return AuthServiceReset.verify_reset_otp(payload, db)

@router.post("/reset-password")
def reset_password(payload: ResetPasswordRequest, db: Session = Depends(get_db)):
    return AuthServiceReset.reset_password(payload, db)

@router.post("/verify-login-2fa")
def verify_login_2fa(payload: VerifyTwoFactorRequest, response: Response, db: Session = Depends(get_db)):
    res_data = AuthServiceLogin.verify_login_2fa(payload.temp_token, payload.otp_code, db)
    response.set_cookie(
        key="refresh_token",
        value=res_data["refresh_token"],
        httponly=True,
        secure=False,
        samesite="lax",
        path="/",
        max_age=14 * 24 * 60 * 60
    )
    del res_data["refresh_token"]
    return res_data

# --- 2FA SETUP ROUTES ---
@router.post("/enable-2fa-request")
def enable_2fa_request(background_tasks: BackgroundTasks, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return AuthServiceTwoFactor.request_enable_2fa(current_user.user_id, background_tasks, db)

@router.post("/enable-2fa-verify/{otp_code}")
def enable_2fa_verify(otp_code: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return AuthServiceTwoFactor.verify_enable_2fa(current_user.user_id, otp_code, db)

@router.post("/disable-2fa")
def disable_2fa(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return AuthServiceTwoFactor.disable_2fa(current_user.user_id, db)

@router.post("/refresh")
def refresh_access_token(response: Response, refresh_token: str = Cookie(None), db: Session = Depends(get_db)):
    if not refresh_token:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Refresh token missing")
        
    res_data = AuthServiceLogin.refresh_access_token(refresh_token, db)
    
    response.set_cookie(
        key="refresh_token",
        value=res_data["refresh_token"],
        httponly=True,
        secure=False,
        samesite="lax",
        path="/",
        max_age=14 * 24 * 60 * 60
    )
    del res_data["refresh_token"]
    return res_data

@router.get("/me")
def get_me(current_user: User = Depends(get_current_user)):
    return {
        "user_id": current_user.user_id,
        "email": current_user.email,
        "full_name": current_user.full_name,
        "two_factor_enabled": current_user.two_factor_enabled
    }
