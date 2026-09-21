
from sqlalchemy import text
from app.database.db import engine

def add_column():
    with engine.connect() as conn:
        try:
            conn.execute(text("ALTER TABLE project_members ADD COLUMN can_manage_roles BOOLEAN NOT NULL DEFAULT 0;"))
            conn.commit()
            print("Successfully added can_manage_roles to project_members")
        except Exception as e:
            print("Error:", e)

if __name__ == "__main__":
    add_column()

