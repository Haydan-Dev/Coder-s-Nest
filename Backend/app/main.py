from fastapi import FastAPI  
from app.middleware import setup_middleware
from app.api.routes.auth import router as auth_router
from app.api.routes.projects import router as projects_router
from app.api.routes.workspaces import router as workspaces_router
from app.api.routes.folders import router as folders_router
from app.api.routes.files import router as files_router
from app.api.routes.terminal import router as terminal_router
from app.api.routes.users import router as users_router
from fastapi.staticfiles import StaticFiles
import os

app = FastAPI() 
setup_middleware(app)

UPLOAD_DIR = os.path.join(os.path.dirname(__file__), "..", "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")


# @app.get('/')
# def Home():
#     return{"Message":"main.py is running successfully"}

app.include_router(auth_router)
app.include_router(projects_router)
app.include_router(workspaces_router)
app.include_router(folders_router)
app.include_router(files_router)
app.include_router(terminal_router)
app.include_router(users_router)

from app.api.routes.billing import router as billing_router
app.include_router(billing_router)

from app.api.routes.notifications import router as notifications_router
app.include_router(notifications_router, prefix="/notifications", tags=["Notifications"])


from app.api.routes.activity_logs import router as activity_logs_router
app.include_router(activity_logs_router, tags=["Activity Logs"])

from app.api.routes.collaboration import y_asgi_app, y_websocket_server
app.mount("/ws/collaboration", y_asgi_app)

@app.on_event("startup")
async def start_yjs_server():
    import asyncio
    asyncio.create_task(y_websocket_server.start())

from app.api.routes.global_chat import router as global_chat_router
app.include_router(global_chat_router)

from app.api.routes.dm_chat import router as dm_chat_router
app.include_router(dm_chat_router)

from app.api.routes.chat import router as chat_router
app.include_router(chat_router)

# Mount frontend
from fastapi.responses import FileResponse
frontend_dist = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "User", "dist"))
if os.path.exists(os.path.join(frontend_dist, "assets")):
    app.mount("/assets", StaticFiles(directory=os.path.join(frontend_dist, "assets")), name="frontend_assets")

@app.get("/{catchall:path}", tags=["Frontend"])
def serve_frontend(catchall: str):
    # Prevent serving index.html for missing API routes or static assets
    api_and_asset_prefixes = (
        "auth/", "projects/", "workspaces/", "folders/", "files/", "users/", 
        "chat/", "notifications/", "ws/", "assets/", "billing/"
    )
    if catchall.startswith(api_and_asset_prefixes):
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Not found")

    file_path = os.path.join(frontend_dist, catchall)
    if os.path.isfile(file_path):
        return FileResponse(file_path)
    # Serve index.html for React Router
    index_path = os.path.join(frontend_dist, "index.html")
    if os.path.isfile(index_path):
        return FileResponse(index_path)
    return {"Message": "main.py is running successfully, but frontend build not found. Run 'npm run build' in User folder."}
