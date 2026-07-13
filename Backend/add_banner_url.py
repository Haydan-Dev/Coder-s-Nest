import os
import sys
from sqlalchemy import text
from dotenv import load_dotenv

sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from app.database.db import engine

load_dotenv()

def migrate():
    with engine.connect() as connection:
        try:
            print("Adding banner_url to users...")
            connection.execute(text("ALTER TABLE users ADD COLUMN banner_url VARCHAR(500) NULL;"))
            print("Successfully added banner_url to users.")
        except Exception as e:
            print(f"Error (might already exist): {e}")

        connection.commit()
        print("Migration complete!")

if __name__ == "__main__":
    migrate()
