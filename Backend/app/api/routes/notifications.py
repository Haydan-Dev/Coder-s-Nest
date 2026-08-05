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

@router.get("/")
def get_user_notifications(db: Session = Depends(get_db)):
    # Optional endpoint to fetch notifications history
    # Typically you'd use get_current_user here
    pass
