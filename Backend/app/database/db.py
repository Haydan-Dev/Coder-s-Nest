
import os

from sqlalchemy import create_engine, event
from sqlalchemy.orm import sessionmaker, declarative_base, Session
from sqlalchemy.engine import URL
from dotenv import load_dotenv
load_dotenv()

# Database configuration from environment variables
DB_HOST = os.getenv("DB_HOST", "127.0.0.1")
DB_PORT = int(os.getenv("DB_PORT", "3306"))
DB_NAME = os.getenv("DB_NAME", "coders_nest")
DB_USER = os.getenv("DB_USER", "root")
DB_PASSWORD = os.getenv("DB_PASSWORD", "")

DATABASE_URL = URL.create(
    drivername="mysql+pymysql",
    username=DB_USER,
    password=DB_PASSWORD,
    host=DB_HOST,
    port=DB_PORT,
    database=DB_NAME,
)

# Aiven requires SSL for the hosted database
connect_args = {}
if os.getenv("DB_SSL", "").lower() == "required":
    connect_args["ssl"] = {"check_hostname": True}

engine = create_engine(
    DATABASE_URL,
    echo=False,
    connect_args=connect_args,
    pool_pre_ping=True,
)

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine,
)

Base = declarative_base()


from app.models.file import File
from app.models.folder import Folder


@event.listens_for(Session, "before_commit")
def receive_before_commit(session):
    session._workspace_sync_ids = set()
    try:
        for obj in list(session.new) + list(session.dirty) + list(session.deleted):
            if isinstance(obj, (File, Folder)):
                if hasattr(obj, "workspace_id") and obj.workspace_id:
                    session._workspace_sync_ids.add(obj.workspace_id)
    except Exception:
        pass


@event.listens_for(Session, "after_commit")
def receive_after_commit(session):
    try:
        if hasattr(session, "_workspace_sync_ids") and session._workspace_sync_ids:
            from app.services.terminal_service import TerminalService

            for w_id in session._workspace_sync_ids:
                try:
                    TerminalService.broadcast_sync_event(w_id)
                except Exception:
                    pass
    except Exception:
        pass
