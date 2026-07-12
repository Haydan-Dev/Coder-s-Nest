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
