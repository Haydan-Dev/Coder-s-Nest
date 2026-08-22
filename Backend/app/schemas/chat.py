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
    sender_username: Optional[str] = None
    
    class Config:
        from_attributes = True

class ConversationResponse(BaseModel):
    conversation_id: int
    project_id: int
    conversation_name: str
    conversation_type: ConversationType
    
    class Config:
        from_attributes = True

# --- New Schemas for Global & DM ---

class GlobalMessageCreate(BaseModel):
    content: str
    message_type: MessageType = MessageType.Text
    reply_to_message_id: Optional[int] = None
    attachment_url: Optional[str] = None
    attachment_type: Optional[str] = None

class GlobalMessageResponse(BaseModel):
    message_id: int
    sender_id: int
    content: str
    
    reply_to_message_id: Optional[int]
    message_type: MessageType
    attachment_url: Optional[str]
    attachment_type: Optional[str]
    is_pinned: bool
    is_forwarded: bool
    is_edited: bool
    is_deleted: bool
    
    created_at: datetime
    updated_at: datetime
    
    sender_name: Optional[str] = None
    sender_username: Optional[str] = None

    class Config:
        from_attributes = True

class DirectMessageCreate(BaseModel):
    content: str
    receiver_id: int
    message_type: MessageType = MessageType.Text
    reply_to_message_id: Optional[int] = None
    attachment_url: Optional[str] = None
    attachment_type: Optional[str] = None

class DirectMessageResponse(BaseModel):
    message_id: int
    sender_id: int
    receiver_id: int
    content: str
    
    reply_to_message_id: Optional[int]
    message_type: MessageType
    attachment_url: Optional[str]
    attachment_type: Optional[str]
    is_pinned: bool
    is_forwarded: bool
    is_edited: bool
    is_deleted: bool
    
    created_at: datetime
    updated_at: datetime
    read_at: Optional[datetime] = None
    
    sender_name: Optional[str] = None
    sender_username: Optional[str] = None

    class Config:
        from_attributes = True

class SidebarChatListResponse(BaseModel):
    # DMs
    user_id: int
    name: str
    username: str
    avatar_text: str
    unread_count: int = 0
    last_message: Optional[str] = None
    last_message_time: Optional[datetime] = None
    status: str = "Offline"

