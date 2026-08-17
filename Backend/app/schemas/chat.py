from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
from app.models.conversation import ConversationType
from app.models.message import MessageType

class MessageCreate(BaseModel):
    content: str
    message_type: MessageType = MessageType.Text
    reply_to_message_id: Optional[int] = None
    attachment_url: Optional[str] = None
    attachment_type: Optional[str] = None

class MessageResponse(BaseModel):
    message_id: int
    conversation_id: int
    sender_id: int
    reply_to_message_id: Optional[int]
    message_type: MessageType
    content: str
    attachment_url: Optional[str]
    attachment_type: Optional[str]
    is_pinned: bool
    is_forwarded: bool
    is_edited: bool
    is_deleted: bool
    created_at: datetime
    updated_at: datetime
    
    # We will attach sender details (like name) from the user table when returning to frontend
    sender_name: Optional[str] = None
    
    class Config:
        from_attributes = True

class ConversationResponse(BaseModel):
    conversation_id: int
    project_id: int
    conversation_name: str
    conversation_type: ConversationType
    
    class Config:
        from_attributes = True
