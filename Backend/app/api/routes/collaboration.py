from fastapi import APIRouter
from ypy_websocket import WebsocketServer, ASGIServer

router = APIRouter()

# Create a global Yjs WebsocketServer to hold all documents in memory
y_websocket_server = WebsocketServer()
# Create an ASGI app from it
y_asgi_app = ASGIServer(y_websocket_server)

# We will mount this ASGI app directly in main.py instead of using a router websocket endpoint.
# The router file can just expose the server instance for other parts of the app (like AI).
