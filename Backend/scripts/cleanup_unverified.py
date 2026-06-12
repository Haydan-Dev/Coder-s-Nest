import sys
import os
from datetime import datetime, timedelta, timezone

# 1. Add the backend directory to sys.path so Python can find "app"
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.database.db import SessionLocal
from app.models.user import User
from app.models.otp_verification import OTPVerification

def cleanup_unverified_accounts():
    db = SessionLocal()
    try:
        # Calculate the threshold (24 hours ago)
        threshold = datetime.now(timezone.utc) - timedelta(hours=24)

        # 2. Get emails of unverified users older than 24 hours
        unverified_users = db.query(User).filter(
            User.is_email_verified == False,
            User.created_at < threshold
        ).all()

        if not unverified_users:
            print("No unverified accounts to clean up.")
            return

        emails_to_delete = [user.email for user in unverified_users]
        user_ids_to_delete = [user.user_id for user in unverified_users]

        print(f"Found {len(user_ids_to_delete)} unverified users to clean up.")

        # 3. Delete OTP records first (avoids orphaned data)
        db.query(OTPVerification).filter(
            OTPVerification.verification_target.in_(emails_to_delete)
        ).delete(synchronize_session=False)

        # 4. Delete the unverified users
        db.query(User).filter(
            User.user_id.in_(user_ids_to_delete)
        ).delete(synchronize_session=False)

        # 5. Commit the transaction
        db.commit()
        print("Cleanup successful.")

    except Exception as e:
        db.rollback()
        print(f"Error during cleanup: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    cleanup_unverified_accounts()
