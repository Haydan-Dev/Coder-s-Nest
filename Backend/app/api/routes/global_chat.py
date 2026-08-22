from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List

from app.database.deps import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.schemas.chat import GlobalMessageResponse
from app.services.chat_global_service import GlobalChatService

router = APIRouter(
    prefix="/chat/global",
    tags=["Chat Global"]
)

@router.get("/messages", response_model=List[GlobalMessageResponse])
def get_global_chat_history(limit: int = 50, offset: int = 0, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    messages = GlobalChatService.get_messages(db, limit, offset)
    
    for msg in messages:
        if getattr(msg, 'sender', None):
            msg.sender_name = msg.sender.full_name
            msg.sender_username = msg.sender.username
            
    # Reverse so oldest is first (typical chat display)
    return list(reversed(messages))
