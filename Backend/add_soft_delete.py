import os
import sys
from sqlalchemy import text
from dotenv import load_dotenv

# Add app to path so we can import from database
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from app.database.db import engine

load_dotenv()

def migrate():
    with engine.connect() as connection:
        try:
            print("Adding deleted_at to files...")
            connection.execute(text("ALTER TABLE files ADD COLUMN deleted_at DATETIME NULL;"))
            print("Successfully added deleted_at to files.")
        except Exception as e:
            print(f"Error (might already exist): {e}")

        try:
            print("Adding is_deleted to folders...")
            connection.execute(text("ALTER TABLE folders ADD COLUMN is_deleted BOOLEAN NOT NULL DEFAULT FALSE;"))
            print("Successfully added is_deleted to folders.")
        except Exception as e:
            print(f"Error (might already exist): {e}")

        try:
            print("Adding deleted_at to folders...")
            connection.execute(text("ALTER TABLE folders ADD COLUMN deleted_at DATETIME NULL;"))
            print("Successfully added deleted_at to folders.")
        except Exception as e:
            print(f"Error (might already exist): {e}")
        
        connection.commit()
        print("Migration complete!")

if __name__ == "__main__":
    migrate()
