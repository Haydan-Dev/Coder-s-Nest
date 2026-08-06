from fastapi import APIRouter, Depends, WebSocket, WebSocketDisconnect
from sqlalchemy.orm import Session
from app.database.deps import get_db
from app.services.notification_service import NotificationService
from app.models.notification import Notification

router = APIRouter()

@router.websocket("/ws/{user_id}")
async def notification_websocket(websocket: WebSocket, user_id: int, db: Session = Depends(get_db)):
    await NotificationService.connect(websocket, user_id, db)
    try:
        while True:
            data = await websocket.receive_text()
            # We don't really expect clients to send messages here, just keep alive
    except WebSocketDisconnect:
        NotificationService.disconnect(websocket, user_id)

from app.api.deps import get_current_user
from app.models.user import User
from app.services.project_service import time_ago

@router.get("/")
def get_user_notifications(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    notifications = db.query(Notification).filter(
        Notification.user_id == current_user.user_id,
        Notification.type != "INVITE"
    ).order_by(Notification.created_at.desc()).all()
    
    result = []
    for notif in notifications:
        avatar_icon = "🔔"
        gradient = "linear-gradient(135deg, #3b82f6, #2563eb)" # default blue
        
        if notif.type in ["INVITE_ACCEPTED", "INVITE_ACCEPTED_SELF"]:
            avatar_icon = "✅"
            gradient = "linear-gradient(135deg, #10b981, #059669)" # emerald
        elif notif.type in ["INVITE_REJECTED", "INVITE_REJECTED_SELF"]:
            avatar_icon = "❌"
            gradient = "linear-gradient(135deg, #ef4444, #dc2626)" # red
        elif notif.type == "INVITE_SENT":
            avatar_icon = "📨"
            gradient = "linear-gradient(135deg, #6366f1, #4f46e5)" # indigo
        elif notif.type == "ROLE_UPDATED":
            avatar_icon = "👑"
            gradient = "linear-gradient(135deg, #8b5cf6, #7c3aed)" # purple
        elif notif.type == "KICK":
            avatar_icon = "🚫"
            gradient = "linear-gradient(135deg, #ef4444, #b91c1c)" # dark red
        elif notif.type == "SUSPEND":
            avatar_icon = "⏸️"
            gradient = "linear-gradient(135deg, #f59e0b, #d97706)" # amber/orange
        elif notif.type == "UNSUSPEND":
            avatar_icon = "▶️"
            gradient = "linear-gradient(135deg, #10b981, #059669)" # emerald
        elif notif.type == "PERMISSIONS_UPDATED":
            avatar_icon = "🔐"
            gradient = "linear-gradient(135deg, #0ea5e9, #0284c7)" # sky blue

        result.append({
            "id": f"notif_{notif.notifications_id}",
            "db_id": notif.notifications_id,
            "unread": notif.is_read == False,
            "type": notif.type,
            "avatar": avatar_icon,
            "gradient": gradient,
            "text": notif.message,
            "time": time_ago(notif.created_at),
            "created_at": notif.created_at.isoformat(),
            "timestamp": notif.created_at.timestamp(),
            "status": ""
        })
    return result

@router.put("/{notification_id}/read")
def mark_notification_read(notification_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    notification = db.query(Notification).filter(Notification.notifications_id == notification_id, Notification.user_id == current_user.user_id).first()
    if notification:
        notification.is_read = True
        db.commit()
    return {"status": "success"}

@router.put("/read-all")
def mark_all_read(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    db.query(Notification).filter(Notification.user_id == current_user.user_id, Notification.is_read == False).update({"is_read": True})
    db.commit()
    return {"status": "success"}
