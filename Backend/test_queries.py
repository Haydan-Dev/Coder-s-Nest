import sys
import time
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

print("1. Importing models...")
from app.models.user import User
from app.models.project import Project
from app.models.activity_log import ActivityLog
from app.database.db import SessionLocal

print("2. Getting session...")
db = SessionLocal()

print("3. Querying Users...")
try:
    start = time.time()
    total_users = db.query(User).filter(User.is_deleted == False).count()
    print(f"Total Users: {total_users} (took {time.time() - start:.2f}s)")
except Exception as e:
    print(f"Error querying users: {e}")

print("4. Querying Projects...")
try:
    start = time.time()
    total_projects = db.query(Project).filter(Project.is_deleted == False).count()
    print(f"Total Projects: {total_projects} (took {time.time() - start:.2f}s)")
except Exception as e:
    print(f"Error querying projects: {e}")

print("5. Querying Activity Logs...")
try:
    start = time.time()
    recent_logs = db.query(ActivityLog).limit(5).all()
    print(f"Total Logs fetched: {len(recent_logs)} (took {time.time() - start:.2f}s)")
except Exception as e:
    print(f"Error querying logs: {e}")

db.close()
print("Done!")
