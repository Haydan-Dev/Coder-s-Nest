import json
from typing import Dict, List
from fastapi import WebSocket, WebSocketDisconnect
from sqlalchemy.orm import Session
from app.models.notification import Notification
from app.models.user import User

class NotificationService:
    # Maps user_id -> List of active WebSockets
    _active_connections: Dict[int, List[WebSocket]] = {}
    _main_loop = None

    @classmethod
    async def connect(cls, websocket: WebSocket, user_id: int, db: Session):
        import asyncio
        if cls._main_loop is None:
            cls._main_loop = asyncio.get_running_loop()
        
        await websocket.accept()
        if user_id not in cls._active_connections:
            cls._active_connections[user_id] = []
        cls._active_connections[user_id].append(websocket)
        
        # Push all missed/unread offline notifications
        unread_notifs = db.query(Notification).filter(
            Notification.user_id == user_id,
            Notification.is_read == False
        ).order_by(Notification.created_at.asc()).all()
        
        for notif in unread_notifs:
            payload = {
                "id": notif.notifications_id,
                "type": notif.type,
                "title": notif.title,
                "message": notif.message,
                "reference_id": notif.reference_id,
                "is_read": True,
                "created_at": notif.created_at.isoformat()
            }
            try:
                await websocket.send_json({"event": "NOTIFICATION", "data": payload})
                notif.is_read = True
            except Exception:
                pass
        
        if unread_notifs:
            db.commit()

    @classmethod
    def disconnect(cls, websocket: WebSocket, user_id: int):
        if user_id in cls._active_connections:
            if websocket in cls._active_connections[user_id]:
                cls._active_connections[user_id].remove(websocket)
            if not cls._active_connections[user_id]:
                del cls._active_connections[user_id]

    @classmethod
    def send_personal_notification(cls, db: Session, user_id: int, type_: str, title: str, message: str, reference_id: int = None):
        # 1. Save to database for offline users / history
        new_notif = Notification(
            user_id=user_id,
            type=type_,
            title=title,
            message=message,
            reference_id=reference_id,
            is_read=False
        )
        db.add(new_notif)
        db.commit()
        db.refresh(new_notif)

        # 2. Push to active WebSockets if online
        if user_id in cls._active_connections:
            payload = {
                "id": new_notif.notifications_id,
                "type": new_notif.type,
                "title": new_notif.title,
                "message": new_notif.message,
                "reference_id": new_notif.reference_id,
                "is_read": new_notif.is_read,
                "created_at": new_notif.created_at.isoformat()
            }
            
            import asyncio
            
            async def _broadcast():
                dead_sockets = []
                for ws in cls._active_connections[user_id]:
                    try:
                        await ws.send_json({"event": "NOTIFICATION", "data": payload})
                    except Exception:
                        dead_sockets.append(ws)
                        
                for ws in dead_sockets:
                    cls.disconnect(ws, user_id)
            
            # Run the broadcast safely in the main loop
            if cls._main_loop and not cls._main_loop.is_closed():
                asyncio.run_coroutine_threadsafe(_broadcast(), cls._main_loop)
