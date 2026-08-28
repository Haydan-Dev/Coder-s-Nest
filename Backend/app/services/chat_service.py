from sqlalchemy.orm import Session
from app.models.conversation import Conversation, ConversationType
from app.models.conversation_member import ConversationMember, MemberRole
from app.models.message import Message, MessageType
from app.schemas.chat import MessageCreate
from fastapi import WebSocket
from typing import Dict, List
import json

class ChatConnectionManager:
    def __init__(self):
        # Dictionary to store active connections per project: {project_id: [websocket1, websocket2, ...]}
        self.active_connections: Dict[int, List[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, project_id: int):
        await websocket.accept()
        if project_id not in self.active_connections:
            self.active_connections[project_id] = []
        self.active_connections[project_id].append(websocket)

    def disconnect(self, websocket: WebSocket, project_id: int):
        if project_id in self.active_connections:
            if websocket in self.active_connections[project_id]:
                self.active_connections[project_id].remove(websocket)
            if not self.active_connections[project_id]:
                del self.active_connections[project_id]

    async def broadcast(self, message: str, project_id: int):
        if project_id in self.active_connections:
            for connection in self.active_connections[project_id]:
                try:
                    await connection.send_text(message)
                except Exception as e:
                    print(f"Error sending chat message: {e}")

chat_manager = ChatConnectionManager()

class ChatService:
    @staticmethod
    def get_or_create_project_conversation(db: Session, project_id: int, user_id: int) -> Conversation:
        # Check if project team conversation already exists
        conversation = db.query(Conversation).filter(
            Conversation.project_id == project_id,
            Conversation.conversation_type == ConversationType.Team
        ).first()

        if not conversation:
            # Create a new conversation for this project
            conversation = Conversation(
                project_id=project_id,
                created_by_user_id=user_id,
                conversation_name=f"Project {project_id} General",
                conversation_type=ConversationType.Team,
            )
            db.add(conversation)
            db.commit()
            db.refresh(conversation)

        # Ensure the user is a member of this conversation
        member = db.query(ConversationMember).filter(
            ConversationMember.conversation_id == conversation.conversation_id,
            ConversationMember.user_id == user_id
        ).first()

        if not member:
            member = ConversationMember(
                conversation_id=conversation.conversation_id,
                user_id=user_id,
                member_role=MemberRole.Member
            )
            db.add(member)
            db.commit()

        return conversation

    @staticmethod
    def save_message(db: Session, conversation_id: int, sender_id: int, msg: MessageCreate) -> Message:
        db_msg = Message(
            conversation_id=conversation_id,
            sender_id=sender_id,
            content=msg.content,
            message_type=msg.message_type,
            reply_to_message_id=msg.reply_to_message_id,
            attachment_url=msg.attachment_url,
            attachment_type=msg.attachment_type
        )
        db.add(db_msg)
        db.commit()
        db.refresh(db_msg)
        return db_msg

    @staticmethod
    def get_messages(db: Session, conversation_id: int, limit: int = 50, offset: int = 0) -> List[Message]:
        from sqlalchemy.orm import joinedload
        return db.query(Message).options(joinedload(Message.sender)).filter(
            Message.conversation_id == conversation_id
        ).order_by(Message.created_at.desc()).offset(offset).limit(limit).all()

    @staticmethod
    def soft_delete_message(db: Session, message_id: int, user_id: int) -> bool:
        msg = db.query(Message).filter(Message.message_id == message_id).first()
        if not msg:
            return False
        if msg.sender_id != user_id:
            return False
            
        msg.is_deleted = True
        msg.content = "This message was deleted"
        db.commit()
        return True
