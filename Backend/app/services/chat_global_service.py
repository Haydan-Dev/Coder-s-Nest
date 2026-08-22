from sqlalchemy.orm import Session
from app.models.chat_global import GlobalMessage
from app.schemas.chat import GlobalMessageCreate
from typing import List

class GlobalChatService:
    @staticmethod
    def save_message(db: Session, sender_id: int, msg: GlobalMessageCreate) -> GlobalMessage:
        db_msg = GlobalMessage(
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
    def get_messages(db: Session, limit: int = 50, offset: int = 0) -> List[GlobalMessage]:
        from sqlalchemy.orm import joinedload
        return db.query(GlobalMessage).options(joinedload(GlobalMessage.sender)).order_by(
            GlobalMessage.created_at.desc()
        ).offset(offset).limit(limit).all()
