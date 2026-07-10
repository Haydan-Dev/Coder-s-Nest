from fastapi import APIRouter, WebSocket, Depends
from sqlalchemy.orm import Session
from app.database.deps import get_db
from app.services.terminal_service import TerminalService

router = APIRouter()

@router.websocket("/ws/{workspace_id}")
async def terminal_websocket(websocket: WebSocket, workspace_id: int, db: Session = Depends(get_db)):
    await TerminalService.handle_terminal_session(websocket, workspace_id, db)
