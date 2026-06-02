from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.schemas.auth import SignupSchema
from app.database.deps import get_db
from app.services.auth_service import AuthService

router = APIRouter(
    prefix="/auth",
    tags=["Auth"]
)


@router.post("/signup")
def signup(user: SignupSchema, db: Session = Depends(get_db)):
    return AuthService.signup(user, db)