from fastapi import APIRouter, Depends, WebSocket, WebSocketDisconnect
from sqlalchemy.orm import Session
from typing import List
import json

from app.database.deps import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.schemas.chat import MessageResponse, MessageCreate
from app.services.chat_service import ChatService, chat_manager

router = APIRouter(
    prefix="/chat",
    tags=["Chat"]
)

@router.get("/{project_id}/messages", response_model=List[MessageResponse])
def get_chat_history(project_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    # Ensure a conversation exists for the project
    conversation = ChatService.get_or_create_project_conversation(db, project_id, current_user.user_id)
    
    messages = ChatService.get_messages(db, conversation.conversation_id)
    
    # Optional: Attach sender_name if you want to populate the schema's sender_name field
    for msg in messages:
        if getattr(msg, 'sender', None):
            msg.sender_name = msg.sender.full_name
            msg.sender_username = msg.sender.username
        
    return messages

@router.websocket("/{project_id}/ws")
async def chat_websocket(websocket: WebSocket, project_id: int, db: Session = Depends(get_db)):
    # Accept the websocket connection
    await chat_manager.connect(websocket, project_id)
    try:
        while True:
            # Receive text data from frontend
            data = await websocket.receive_text()
            payload = json.loads(data)
            
            # The frontend should send: {"content": "hello", "sender_id": 1, "message_type": "Text"}
            # Create a Conversation first to get its ID
            # In WebSockets, we might not have `current_user` easily via headers, so we rely on sender_id from payload for now.
            sender_id = payload.get("sender_id")
            conversation = ChatService.get_or_create_project_conversation(db, project_id, sender_id)
            
            msg_create = MessageCreate(
                content=payload.get("content", ""),
                message_type=payload.get("message_type", "Text")
            )
            
            # Save the message to DB
            saved_msg = ChatService.save_message(db, conversation.conversation_id, sender_id, msg_create)
            
            sender_user = db.query(User).filter(User.user_id == sender_id).first()
            
            # Broadcast the saved message to all clients in this project's chat room
            broadcast_payload = {
                "message_id": saved_msg.message_id,
                "sender_id": saved_msg.sender_id,
                "content": saved_msg.content,
                "created_at": saved_msg.created_at.isoformat(),
                "message_type": saved_msg.message_type,
                "sender_name": sender_user.full_name if sender_user else None,
                "sender_username": sender_user.username if sender_user else None
            }
            await chat_manager.broadcast(json.dumps(broadcast_payload), project_id)
            
    except WebSocketDisconnect:
        chat_manager.disconnect(websocket, project_id)
    except Exception as e:
        print(f"Chat WebSocket Error: {e}")
        chat_manager.disconnect(websocket, project_id)
