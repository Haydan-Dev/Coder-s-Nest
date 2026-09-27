from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker,declarative_base

# database url
DATABASE_URL = "mysql+pymysql://root:@127.0.0.1/coders_nest"

#creating main engine for db and apis
engine = create_engine(DATABASE_URL, echo=False)

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)

Base = declarative_base()

from sqlalchemy import event
from sqlalchemy.orm import Session
from app.models.file import File
from app.models.folder import Folder

@event.listens_for(Session, 'before_commit')
def receive_before_commit(session):
    session._workspace_sync_ids = set()
    try:
        for obj in list(session.new) + list(session.dirty) + list(session.deleted):
            if isinstance(obj, File) or isinstance(obj, Folder):
                if hasattr(obj, 'workspace_id') and obj.workspace_id:
                    session._workspace_sync_ids.add(obj.workspace_id)
    except:
        pass

@event.listens_for(Session, 'after_commit')
def receive_after_commit(session):
    try:
        if hasattr(session, '_workspace_sync_ids') and session._workspace_sync_ids:
            from app.services.terminal_service import TerminalService
            for w_id in session._workspace_sync_ids:
                try:
                    TerminalService.broadcast_sync_event(w_id)
                except:
                    pass
    except:
        pass