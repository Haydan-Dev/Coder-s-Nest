from sqlalchemy import text
from app.database.db import SessionLocal

db = SessionLocal()
try:
    db.execute(text("ALTER TABLE notifications MODIFY type VARCHAR(100) NOT NULL"))
    db.commit()
    print("Successfully altered notifications table!")
except Exception as e:
    print("Error:", e)
finally:
    db.close()
