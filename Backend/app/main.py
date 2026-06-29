from fastapi import FastAPI  
from app.middleware import setup_middleware
from app.api.routes.auth import router as auth_router
from app.api.routes.projects import router as projects_router


app = FastAPI() 
setup_middleware(app)


@app.get('/')
def Home():
    return{"Message":"main.py is running successfully"}

app.include_router(auth_router)
app.include_router(projects_router)
