from sqlalchemy import text
from app.database.db import SessionLocal

db = SessionLocal()

try:
    db.execute(text("UPDATE plans SET monthly_price = 499, yearly_price = 4999 WHERE name = 'Pro';"))
    db.execute(text("UPDATE plans SET monthly_price = 999, yearly_price = 9999 WHERE name = 'Team';"))
    db.commit()
    print("Done")
except Exception as e:
    db.rollback()
    print("Error:", e)
finally:
    db.close()
