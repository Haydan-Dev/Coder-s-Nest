from fastapi import APIRouter, WebSocket
from app.services.terminal_service import TerminalService

router = APIRouter()

@router.websocket("/ws/{workspace_id}")
async def terminal_websocket(websocket: WebSocket, workspace_id: int):
    await TerminalService.handle_terminal_session(websocket, workspace_id)
