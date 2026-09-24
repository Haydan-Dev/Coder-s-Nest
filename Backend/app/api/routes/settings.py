from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database.deps import get_db
from app.models.system_setting import SystemSetting
import json

router = APIRouter()

@router.get("/admin/settings")
def get_admin_settings(db: Session = Depends(get_db)):
    settings = db.query(SystemSetting).all()
    # Convert list of rows to a dictionary of setting_key -> setting_value
    data = {}
    for s in settings:
        # Pydantic/FastAPI automatically handles JSON type, but some JSON might be scalar (like boolean)
        try:
            val = json.loads(s.setting_value) if isinstance(s.setting_value, str) else s.setting_value
            data[s.setting_key] = val
        except:
            data[s.setting_key] = s.setting_value
    
    return data

@router.put("/admin/settings")
def update_admin_settings(payload: dict, db: Session = Depends(get_db)):
    for key, val in payload.items():
        setting = db.query(SystemSetting).filter(SystemSetting.setting_key == key).first()
        if not setting:
            setting = SystemSetting(setting_key=key)
            db.add(setting)
        
        # Serialize the value appropriately
        setting.setting_value = json.dumps(val) if not isinstance(val, str) else val

    db.commit()
    return {"message": "Settings updated successfully"}

@router.get("/settings/public")
def get_public_settings(db: Session = Depends(get_db)):
    settings = db.query(SystemSetting).all()
    
    # Safe keys to expose publicly
    safe_keys = [
        "maintenance_mode", 
        "maintenance_message", 
        "announcement_banner", 
        "announcement_text", 
        "announcement_type", 
        "feature_flags",
        "allow_registrations",
        "project_languages",
        "project_colors"
    ]
    
    data = {}
    for s in settings:
        if s.setting_key in safe_keys:
            try:
                val = json.loads(s.setting_value) if isinstance(s.setting_value, str) else s.setting_value
                data[s.setting_key] = val
            except:
                data[s.setting_key] = s.setting_value
                
    return data
