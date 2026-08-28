from fastapi import APIRouter, Depends, WebSocket, WebSocketDisconnect
from sqlalchemy.orm import Session
from typing import List
import json

from app.database.deps import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.schemas.chat import MessageResponse, MessageCreate, GlobalMessageCreate, DirectMessageCreate
from app.services.chat_service import ChatService, chat_manager
from app.services.chat_global_service import GlobalChatService
from app.services.chat_dm_service import DirectMessageService
from app.services.chat_websocket import universal_chat_manager

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

@router.delete("/project/{message_id}")
def delete_project_message(message_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    from fastapi import HTTPException
    success = ChatService.soft_delete_message(db, message_id, current_user.user_id)
    if not success:
        raise HTTPException(status_code=403, detail="Not authorized or message not found")
    return {"status": "success", "message": "Message deleted successfully"}

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
                "sender_username": sender_user.username if sender_user else None,
                "trigger_sync": payload.get("trigger_sync", False)
            }
            await chat_manager.broadcast(json.dumps(broadcast_payload), project_id)
            
            # Cross-broadcast to universal chat manager so users on Messages.jsx also see it
            from app.models.conversation_member import ConversationMember
            members = db.query(ConversationMember).filter(ConversationMember.conversation_id == conversation.conversation_id).all()
            member_ids = [m.user_id for m in members]
            
            universal_payload = {
                "type": "PROJECT",
                "project_id": project_id,
                "message_id": saved_msg.message_id,
                "sender_id": saved_msg.sender_id,
                "content": saved_msg.content,
                "created_at": saved_msg.created_at.isoformat(),
                "sender_name": sender_user.full_name if sender_user else None,
                "sender_username": sender_user.username if sender_user else None,
                "message_type": saved_msg.message_type,
                "trigger_sync": payload.get("trigger_sync", False)
            }
            await universal_chat_manager.broadcast_to_users(json.dumps(universal_payload), member_ids)
            
    except WebSocketDisconnect:
        chat_manager.disconnect(websocket, project_id)
    except Exception as e:
        print(f"Chat WebSocket Error: {e}")
        chat_manager.disconnect(websocket, project_id)

@router.websocket("/ws/universal")
async def universal_chat_websocket(websocket: WebSocket, db: Session = Depends(get_db)):
    # Connect user. In a real app we'd get user_id from token. Here we wait for first auth message.
    await websocket.accept()
    user_id = None
    
    try:
        while True:
            data = await websocket.receive_text()
            payload = json.loads(data)
            
            # 1. Handle Connection Auth (first message should contain sender_id)
            if not user_id and payload.get("sender_id"):
                user_id = payload.get("sender_id")
                # Add them to active connections
                await universal_chat_manager.connect(websocket, user_id)
            
            if not user_id:
                continue # Cannot process without knowing who it is
                
            msg_type = payload.get("type") # "GLOBAL", "DM", "PROJECT"
            content = payload.get("content", "")
            target_id = payload.get("target_id") # Receiver ID for DM, Project ID for Project
            
            sender_user = db.query(User).filter(User.user_id == user_id).first()
            sender_name = sender_user.full_name if sender_user else None
            sender_username = sender_user.username if sender_user else None
            
            if msg_type == "GLOBAL":
                msg_create = GlobalMessageCreate(content=content)
                saved_msg = GlobalChatService.save_message(db, user_id, msg_create)
                
                broadcast_payload = {
                    "type": "GLOBAL",
                    "message_id": saved_msg.message_id,
                    "sender_id": user_id,
                    "content": content,
                    "created_at": saved_msg.created_at.isoformat(),
                    "sender_name": sender_name,
                    "sender_username": sender_username
                }
                await universal_chat_manager.broadcast_global(json.dumps(broadcast_payload))
                
            elif msg_type == "DM":
                if not target_id:
                    continue
                msg_create = DirectMessageCreate(content=content, receiver_id=target_id)
                saved_msg = DirectMessageService.save_message(db, user_id, msg_create)
                
                broadcast_payload = {
                    "type": "DM",
                    "message_id": saved_msg.message_id,
                    "sender_id": user_id,
                    "receiver_id": target_id,
                    "content": content,
                    "created_at": saved_msg.created_at.isoformat(),
                    "sender_name": sender_name,
                    "sender_username": sender_username
                }
                # Send to both sender (for their UI to update if they have multiple devices) and receiver
                await universal_chat_manager.send_personal_message(json.dumps(broadcast_payload), target_id)
                await universal_chat_manager.send_personal_message(json.dumps(broadcast_payload), user_id)
                
            elif msg_type == "DELETE_MESSAGE":
                # The frontend sends: type: "DELETE_MESSAGE", message_id: 123, target_id: user_id or project_id, is_dm: bool
                # Since the actual DB deletion is handled by the REST endpoint, this websocket event is purely for live broadcasting the UI update!
                is_dm = payload.get("is_dm", False)
                message_id = payload.get("message_id")
                if not message_id or not target_id:
                    continue
                    
                broadcast_payload = {
                    "type": "DELETE_MESSAGE",
                    "message_id": message_id,
                    "is_dm": is_dm,
                    "target_id": target_id # The conversation context
                }
                
                if is_dm:
                    # Target is the other user
                    await universal_chat_manager.send_personal_message(json.dumps(broadcast_payload), target_id)
                    await universal_chat_manager.send_personal_message(json.dumps(broadcast_payload), user_id)
                else:
                    # Target is project_id
                    # Broadcast to universal workspace members
                    from app.models.conversation import Conversation, ConversationType
                    from app.models.conversation_member import ConversationMember
                    conversation = db.query(Conversation).filter(
                        Conversation.project_id == target_id,
                        Conversation.conversation_type == ConversationType.Team
                    ).first()
                    if conversation:
                        members = db.query(ConversationMember).filter(ConversationMember.conversation_id == conversation.conversation_id).all()
                        member_ids = [m.user_id for m in members]
                        await universal_chat_manager.broadcast_to_users(json.dumps(broadcast_payload), member_ids)
                        
                    # Also broadcast to project chat socket
                    await chat_manager.broadcast(json.dumps(broadcast_payload), target_id)

            elif msg_type == "PROJECT":
                if not target_id:
                    continue
                # Save to project chat
                conversation = ChatService.get_or_create_project_conversation(db, target_id, user_id)
                msg_create_proj = MessageCreate(content=content, message_type="Text")
                saved_msg = ChatService.save_message(db, conversation.conversation_id, user_id, msg_create_proj)
                
                broadcast_payload = {
                    "type": "PROJECT",
                    "project_id": target_id,
                    "message_id": saved_msg.message_id,
                    "sender_id": user_id,
                    "content": content,
                    "created_at": saved_msg.created_at.isoformat(),
                    "sender_name": sender_name,
                    "sender_username": sender_username
                }
                
                # Ideally, we should fetch project members and broadcast to them.
                # For now, we assume frontend logic or broadcast to all project members.
                # Let's get members of this conversation
                from app.models.conversation_member import ConversationMember
                members = db.query(ConversationMember).filter(ConversationMember.conversation_id == conversation.conversation_id).all()
                member_ids = [m.user_id for m in members]
                await universal_chat_manager.broadcast_to_users(json.dumps(broadcast_payload), member_ids)
                
                # Cross-broadcast to Workspace TeamChat users
                workspace_payload = {
                    "message_id": saved_msg.message_id,
                    "sender_id": user_id,
                    "content": content,
                    "created_at": saved_msg.created_at.isoformat(),
                    "message_type": "Text",
                    "sender_name": sender_name,
                    "sender_username": sender_username
                }
                await chat_manager.broadcast(json.dumps(workspace_payload), target_id)

    except WebSocketDisconnect:
        if user_id:
            universal_chat_manager.disconnect(websocket, user_id)
    except Exception as e:
        print(f"Universal Chat WebSocket Error: {e}")
        if user_id:
            universal_chat_manager.disconnect(websocket, user_id)

