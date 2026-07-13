from fastapi import APIRouter, Depends, WebSocket, WebSocketDisconnect
from sqlalchemy.orm import Session

from app.database.deps import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.schemas.workspace import WorkspaceResponse
from app.services.workspace_service import WorkspaceService
from app.services.chat_service import ChatService
router = APIRouter(
    prefix="/workspaces",
    tags=["Workspaces"]
)

@router.get("/project/{project_id}", response_model=WorkspaceResponse)
def get_workspace_by_project(project_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return WorkspaceService.get_workspace_by_project(project_id, current_user.user_id, db)

@router.get("/{workspace_id}", response_model=WorkspaceResponse)
def get_workspace(workspace_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return WorkspaceService.get_workspace_structure(workspace_id, current_user.user_id, db)

@router.websocket("/ws/{workspace_id}/chat")
async def workspace_chat_websocket(websocket: WebSocket, workspace_id: int):
    await ChatService.connect(websocket, workspace_id)
    try:
        while True:
            data = await websocket.receive_json()
            # Broadcast the received message to all connected clients in the workspace
            await ChatService.broadcast_to_workspace(workspace_id, data)
    except WebSocketDisconnect:
        ChatService.disconnect(websocket, workspace_id)
