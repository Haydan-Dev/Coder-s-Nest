import asyncio
from fastapi import WebSocket, WebSocketDisconnect
import json

class ChatService:
    _active_connections = {}  # {workspace_id: [websocket1, websocket2, ...]}

    @classmethod
    async def connect(cls, websocket: WebSocket, workspace_id: int):
        await websocket.accept()
        if workspace_id not in cls._active_connections:
            cls._active_connections[workspace_id] = []
        cls._active_connections[workspace_id].append(websocket)

    @classmethod
    def disconnect(cls, websocket: WebSocket, workspace_id: int):
        if workspace_id in cls._active_connections:
            if websocket in cls._active_connections[workspace_id]:
                cls._active_connections[workspace_id].remove(websocket)
            if not cls._active_connections[workspace_id]:
                del cls._active_connections[workspace_id]

    @classmethod
    async def broadcast_to_workspace(cls, workspace_id: int, message: dict):
        if workspace_id in cls._active_connections:
            for connection in cls._active_connections[workspace_id]:
                try:
                    await connection.send_text(json.dumps(message))
                except Exception as e:
                    print(f"Error sending chat message: {e}")
