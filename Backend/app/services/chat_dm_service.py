from sqlalchemy.orm import Session
from sqlalchemy import or_, and_, update
from app.models.chat_dm import DirectMessage
from app.models.user import User
from app.schemas.chat import DirectMessageCreate, SidebarChatListResponse
from typing import List
from datetime import datetime

class DirectMessageService:
    @staticmethod
    def save_message(db: Session, sender_id: int, msg: DirectMessageCreate) -> DirectMessage:
        db_msg = DirectMessage(
            sender_id=sender_id,
            receiver_id=msg.receiver_id,
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
    def get_messages(db: Session, user1_id: int, user2_id: int, limit: int = 50, offset: int = 0) -> List[DirectMessage]:
        from sqlalchemy.orm import joinedload
        return db.query(DirectMessage).options(joinedload(DirectMessage.sender), joinedload(DirectMessage.receiver)).filter(
            or_(
                and_(DirectMessage.sender_id == user1_id, DirectMessage.receiver_id == user2_id),
                and_(DirectMessage.sender_id == user2_id, DirectMessage.receiver_id == user1_id)
            )
        ).order_by(DirectMessage.created_at.desc()).offset(offset).limit(limit).all()

    @staticmethod
    def mark_as_read(db: Session, receiver_id: int, sender_id: int):
        db.query(DirectMessage).filter(
            DirectMessage.receiver_id == receiver_id,
            DirectMessage.sender_id == sender_id,
            DirectMessage.read_at == None
        ).update({DirectMessage.read_at: datetime.utcnow()}, synchronize_session=False)
        db.commit()

    @staticmethod
    def get_recent_dms_for_user(db: Session, user_id: int) -> List[SidebarChatListResponse]:
        recent_messages = db.query(DirectMessage).filter(
            or_(DirectMessage.sender_id == user_id, DirectMessage.receiver_id == user_id)
        ).order_by(DirectMessage.created_at.desc()).limit(100).all()

        user_dict = {}
        for msg in recent_messages:
            other_user_id = msg.receiver_id if msg.sender_id == user_id else msg.sender_id
            if other_user_id not in user_dict:
                other_user = db.query(User).filter(User.user_id == other_user_id).first()
                if other_user:
                    unread_count = db.query(DirectMessage).filter(
                        DirectMessage.receiver_id == user_id,
                        DirectMessage.sender_id == other_user_id,
                        DirectMessage.read_at == None
                    ).count()

                    user_dict[other_user_id] = SidebarChatListResponse(
                        user_id=other_user_id,
                        name=other_user.full_name,
                        username=other_user.username,
                        avatar_text=other_user.full_name[:2].upper(),
                        unread_count=unread_count,
                        last_message=msg.content,
                        last_message_time=msg.created_at,
                        status="Offline"
                    )
        
        return list(user_dict.values())

    @staticmethod
    def soft_delete_message(db: Session, message_id: int, user_id: int) -> bool:
        msg = db.query(DirectMessage).filter(DirectMessage.message_id == message_id).first()
        if not msg:
            return False
        if msg.sender_id != user_id:
            return False # Only the sender can delete the message
        
        msg.is_deleted = True
        msg.content = "This message was deleted"
        db.commit()
        return True
