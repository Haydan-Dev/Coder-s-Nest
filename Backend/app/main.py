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


@app.get('/')
def Home():
    return{"Message":"main.py is running successfully"}

app.include_router(auth_router)
app.include_router(projects_router)
app.include_router(workspaces_router)
app.include_router(folders_router)
app.include_router(files_router)
app.include_router(terminal_router)
app.include_router(users_router)

from app.api.routes.notifications import router as notifications_router
app.include_router(notifications_router, prefix="/notifications", tags=["Notifications"])

from app.api.routes.activity_logs import router as activity_logs_router
app.include_router(activity_logs_router, tags=["Activity Logs"])

from app.api.routes.collaboration import y_asgi_app
app.mount("/ws/collaboration", y_asgi_app)

from app.api.routes.chat import router as chat_router
app.include_router(chat_router)
