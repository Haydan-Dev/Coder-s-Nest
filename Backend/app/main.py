from fastapi import FastAPI  
from app.api.routes.auth import router as auth_router
app = FastAPI() 

@app.get('/')
def Home():
    return{"Message":"main.py is running successfully"}

app.include_router(auth_router)

