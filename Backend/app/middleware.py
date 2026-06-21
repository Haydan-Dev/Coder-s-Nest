# app/middleware.py

from fastapi.middleware.cors import CORSMiddleware
from app.core.config import IS_PRODUCTION
import os

def setup_middleware(app):
    origins = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ]
    
    if IS_PRODUCTION:
        # Get production origins from env or use defaults
        prod_origins = os.getenv("ALLOWED_ORIGINS", "").split(",")
        origins.extend([origin.strip() for origin in prod_origins if origin.strip()])

    app.add_middleware(
        CORSMiddleware,
        allow_origins=origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )