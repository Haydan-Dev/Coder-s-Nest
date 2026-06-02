from datetime import datetime, timedelta, timezone

def get_otp_expiry(minutes: int = 10):
    return datetime.now(timezone.utc) + timedelta(minutes=minutes)