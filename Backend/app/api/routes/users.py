from fastapi import APIRouter, Depends, UploadFile, File, HTTPException, status
from sqlalchemy.orm import Session
import os
from uuid import uuid4

from app.database.deps import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.schemas.user import UserUpdate, UserResponse, ChangePasswordRequest
from app.core.config import IS_PRODUCTION
from app.services.auth_service import AuthService

router = APIRouter(
    prefix="/users",
    tags=["Users"]
)

UPLOAD_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "..", "uploads", "avatars"))
os.makedirs(UPLOAD_DIR, exist_ok=True)
UPLOAD_BANNER_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "..", "uploads", "banners"))
os.makedirs(UPLOAD_BANNER_DIR, exist_ok=True)

@router.get("/", response_model=list[UserResponse])
def get_all_users(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return db.query(User).filter(User.user_id != current_user.user_id).all()

@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    return current_user

@router.put("/me", response_model=UserResponse)
def update_me(data: UserUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if data.username is not None:
        # Check if username is already taken by someone else
        existing = db.query(User).filter(User.username == data.username, User.user_id != current_user.user_id).first()
        if existing:
            raise HTTPException(status_code=400, detail="Username already taken.")
        current_user.username = data.username
    if data.full_name is not None:
        current_user.full_name = data.full_name
    if data.bio is not None:
        current_user.bio = data.bio
    if data.phone_number is not None:
        current_user.phone_number = data.phone_number
        
    db.commit()
    db.refresh(current_user)
    return current_user

@router.put("/me/password")
def change_password(data: ChangePasswordRequest, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return AuthService.change_password(current_user, data.current_password, data.new_password, db)

@router.post("/me/avatar", response_model=UserResponse)
async def upload_avatar(
    file: UploadFile = File(...), 
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File provided is not an image.")
        
    # Generate unique filename
    ext = file.filename.split(".")[-1]
    filename = f"{current_user.user_id}_{uuid4().hex}.{ext}"
    file_path = os.path.join(UPLOAD_DIR, filename)
    
    # Save the file
    with open(file_path, "wb") as buffer:
        content = await file.read()
        buffer.write(content)
        
    # Delete old avatar if exists
    if current_user.profile_pic_url:
        old_filename = current_user.profile_pic_url.split("/")[-1]
        old_path = os.path.join(UPLOAD_DIR, old_filename)
        if os.path.exists(old_path):
            try:
                os.remove(old_path)
            except Exception:
                pass
                
    # Determine base URL. If in dev, we could use localhost, but relative path works for frontend
    current_user.profile_pic_url = f"/uploads/avatars/{filename}"
    
    db.commit()
    db.refresh(current_user)
    
    return current_user

@router.post("/me/banner", response_model=UserResponse)
async def upload_banner(
    file: UploadFile = File(...), 
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File provided is not an image.")
        
    ext = file.filename.split(".")[-1]
    filename = f"banner_{current_user.user_id}_{uuid4().hex}.{ext}"
    file_path = os.path.join(UPLOAD_BANNER_DIR, filename)
    
    with open(file_path, "wb") as buffer:
        content = await file.read()
        buffer.write(content)
        
    if current_user.banner_url:
        old_filename = current_user.banner_url.split("/")[-1]
        old_path = os.path.join(UPLOAD_BANNER_DIR, old_filename)
        if os.path.exists(old_path):
            try:
                os.remove(old_path)
            except Exception:
                pass
                
    current_user.banner_url = f"/uploads/banners/{filename}"
    
    db.commit()
    db.refresh(current_user)
    
    return current_user
