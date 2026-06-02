from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def hash_otp(otp: str) -> str:
    return pwd_context.hash(otp)

def verify_otp(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)

