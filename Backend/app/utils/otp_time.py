from datetime import datetime, timedelta, timezone

def get_otp_expiry(minutes: int = 3):
    return datetime.now(timezone.utc) + timedelta(minutes=minutes)

def ensure_utc(dt: datetime) -> datetime:
    """Safely converts a database naive datetime to a timezone-aware UTC datetime."""
    if dt is None:
        return None
    if dt.tzinfo is None:
        return dt.replace(tzinfo=timezone.utc)
    return dt.astimezone(timezone.utc)
