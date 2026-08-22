from fastapi import WebSocket
from typing import Dict, List, Optional
import json

class UniversalChatConnectionManager:
    def __init__(self):
        # We will track all connected clients.
        # Format: {user_id: [websocket1, websocket2, ...]}
        self.active_connections: Dict[int, List[WebSocket]] = {}
        
        # We can also track who is in which room, but for DMs and Global it's easier to just 
        # look up the active_connections dict and send directly to the specific user(s).

    async def connect(self, websocket: WebSocket, user_id: int):
        if user_id not in self.active_connections:
            self.active_connections[user_id] = []
        self.active_connections[user_id].append(websocket)

    def disconnect(self, websocket: WebSocket, user_id: int):
        if user_id in self.active_connections:
            if websocket in self.active_connections[user_id]:
                self.active_connections[user_id].remove(websocket)
            if not self.active_connections[user_id]:
                del self.active_connections[user_id]

    async def send_personal_message(self, message: str, user_id: int):
        if user_id in self.active_connections:
            for connection in self.active_connections[user_id]:
                try:
                    await connection.send_text(message)
                except Exception as e:
                    print(f"Error sending DM to {user_id}: {e}")

    async def broadcast_to_users(self, message: str, user_ids: List[int]):
        """Broadcasts a message to a specific list of user IDs (useful for Projects)"""
        for user_id in user_ids:
            await self.send_personal_message(message, user_id)
            
    async def broadcast_global(self, message: str):
        """Broadcasts to literally everyone connected"""
        for user_id, connections in self.active_connections.items():
            for connection in connections:
                try:
                    await connection.send_text(message)
                except Exception as e:
                    print(f"Error broadcasting global message: {e}")

universal_chat_manager = UniversalChatConnectionManager()
