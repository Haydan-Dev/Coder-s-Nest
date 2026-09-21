
import sys
from app.database.db import SessionLocal
from app.models.project_member import ProjectMember

db = SessionLocal()
try:
    pm = db.query(ProjectMember).first()
    print("SUCCESS:", pm)
except Exception as e:
    import traceback
    traceback.print_exc()

