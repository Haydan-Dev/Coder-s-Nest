from sqlalchemy.orm import Session
from sqlalchemy import or_, and_
from app.models.chat_dm import DirectMessage
from app.models.user import User
from app.schemas.chat import DirectMessageCreate, SidebarChatListResponse
from typing import List

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
    def get_recent_dms_for_user(db: Session, user_id: int) -> List[SidebarChatListResponse]:
        # This will return a list of users the current user has chatted with.
        # For a production app, we would use a complex GROUP BY query, but for now we fetch recent messages
        # and extract the unique users.
        recent_messages = db.query(DirectMessage).filter(
            or_(DirectMessage.sender_id == user_id, DirectMessage.receiver_id == user_id)
        ).order_by(DirectMessage.created_at.desc()).limit(100).all()

        user_dict = {}
        for msg in recent_messages:
            other_user_id = msg.receiver_id if msg.sender_id == user_id else msg.sender_id
            if other_user_id not in user_dict:
                other_user = db.query(User).filter(User.user_id == other_user_id).first()
                if other_user:
                    user_dict[other_user_id] = SidebarChatListResponse(
                        user_id=other_user_id,
                        name=other_user.full_name,
                        username=other_user.username,
                        avatar_text=other_user.full_name[:2].upper(),
                        unread_count=0, # To be calculated later based on read_at
                        last_message=msg.content,
                        last_message_time=msg.created_at,
                        status="Offline" # Real-time status should be merged at the API layer
                    )
        
        return list(user_dict.values())
