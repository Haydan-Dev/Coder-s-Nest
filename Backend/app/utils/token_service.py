from datetime import datetime, timedelta
from jose import jwt, JWTError

# -----------------------------
# CONFIG (production standard)
# -----------------------------
SECRET_KEY = "CHANGE_THIS_TO_ENV_SECRET"
ALGORITHM = "HS256"

ACCESS_TOKEN_EXPIRE_MINUTES = 15      # short lived
REFRESH_TOKEN_EXPIRE_DAYS = 7         # long lived


# -----------------------------
# CREATE ACCESS TOKEN
# -----------------------------
def create_access_token(data: dict):
    to_encode = data.copy()

    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({
        "exp": expire,
        "type": "access"
    })

    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


# -----------------------------
# CREATE REFRESH TOKEN
# -----------------------------
def create_refresh_token(data: dict):
    to_encode = data.copy()

    expire = datetime.utcnow() + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
    to_encode.update({
        "exp": expire,
        "type": "refresh"
    })

    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


# -----------------------------
# VERIFY TOKEN
# -----------------------------
def verify_token(token: str):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except JWTError:
        return None