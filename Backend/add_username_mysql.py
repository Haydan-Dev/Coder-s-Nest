from sqlalchemy import create_engine
from sqlalchemy.sql import text
from app.database.db import DATABASE_URL

engine = create_engine(DATABASE_URL)

with engine.connect() as conn:
    try:
        conn.execute(text("ALTER TABLE users ADD COLUMN username VARCHAR(50) UNIQUE;"))
        conn.commit()
        print("Successfully added username column to MySQL DB.")
    except Exception as e:
        print(f"Error: {e}")
