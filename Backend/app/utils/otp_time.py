from datetime import datetime, timedelta, timezone

def get_otp_expiry(minutes: int = 3):
    return datetime.now(timezone.utc) + timedelta(minutes=minutes)

def ensure_utc(dt: datetime) -> datetime:
    """Safely converts a database datetime to a timezone-aware UTC datetime by treating raw values as UTC."""
    if dt is None:
        return None
    if dt.tzinfo is not None:
        dt = dt.replace(tzinfo=None)
    return dt.replace(tzinfo=timezone.utc)
