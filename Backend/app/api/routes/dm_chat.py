from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List

from app.database.deps import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.schemas.chat import DirectMessageResponse, SidebarChatListResponse
from app.services.chat_dm_service import DirectMessageService

router = APIRouter(
    prefix="/chat/dm",
    tags=["Chat Direct Messages"]
)

@router.get("/sidebar", response_model=List[SidebarChatListResponse])
def get_recent_dms_sidebar(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return DirectMessageService.get_recent_dms_for_user(db, current_user.user_id)

@router.get("/{other_user_id}/messages", response_model=List[DirectMessageResponse])
def get_dm_history(other_user_id: int, limit: int = 50, offset: int = 0, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    messages = DirectMessageService.get_messages(db, current_user.user_id, other_user_id, limit, offset)
    
    # Mark fetched messages as read
    DirectMessageService.mark_as_read(db, current_user.user_id, other_user_id)
    
    for msg in messages:
        if getattr(msg, 'sender', None):
            msg.sender_name = msg.sender.full_name
            msg.sender_username = msg.sender.username
            
    # Reverse so oldest is first
    return list(reversed(messages))

@router.delete("/{message_id}")
def delete_dm(message_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    from fastapi import HTTPException
    success = DirectMessageService.soft_delete_message(db, message_id, current_user.user_id)
    if not success:
        raise HTTPException(status_code=403, detail="Not authorized or message not found")
    return {"status": "success", "message": "Message deleted successfully"}
