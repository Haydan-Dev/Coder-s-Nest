from sqlalchemy import text
from app.database.db import SessionLocal

db = SessionLocal()

try:
    db.execute(text("ALTER TABLE plans ADD COLUMN storage_limit_mb INT NOT NULL DEFAULT 500;"))
except Exception as e:
    print("Column might already exist:", e)

db.execute(text("UPDATE plans SET storage_limit_mb = 500 WHERE name = 'Free';"))
db.execute(text("UPDATE plans SET storage_limit_mb = 2048 WHERE name = 'Pro';"))
db.execute(text("UPDATE plans SET storage_limit_mb = 20480 WHERE name = 'Team';"))

db.commit()
db.close()
print("Done")
