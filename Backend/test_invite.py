from app.database.db import SessionLocal
from app.services.project_service import ProjectService
from app.models.user import User
import sys

def run():
    db = SessionLocal()
    try:
        # Assuming project 19 exists and user 10 exists and wants to invite a user with an email
        project_id = 19
        user_id = 10
        email = "testuser@example.com"
        role = "member"
        print(f"Attempting to invite {email} to project {project_id} by user {user_id}")
        result = ProjectService.invite_user_by_email(project_id, user_id, email, role, db)
        print("Success:", result)
    except Exception as e:
        import traceback
        traceback.print_exc()
    finally:
        db.close()

if __name__ == "__main__":
    run()
