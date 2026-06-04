from datetime import datetime, timedelta, timezone

def get_otp_expiry(minutes: int = 5):
    return datetime.now(timezone.utc) + timedelta(minutes=minutes)